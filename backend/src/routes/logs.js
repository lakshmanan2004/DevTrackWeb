const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { WorkLog, Commit, Task, Alert, Team, Project, User, Setting } = require('../models');
const { authRequired, attachUser, requireRole, ah } = require('../middleware/auth');
const { workLogDto, dayStats } = require('../util/dto');
const { scopeFor } = require('../util/scope');
const { dayStr, fromDayStr, slotForNow, hourLabel, fmtTime, fmtDateMDY, fmtDateLong, requiredSlots, fmtDuration, isWorkday, initialsOf } = require('../util/time');
const { emitToRoles, emitToUser } = require('../sockets');

const router = express.Router();
router.use(authRequired, attachUser);

// ---------- uploads (Vercel Blob when configured, local /uploads otherwise) ----------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });

async function saveUpload(file) {
  if (!file) return { name: '', url: '' };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = require('@vercel/blob');
      const blob = await put(`devtrack/${Date.now()}-${file.originalname}`, file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return { name: file.originalname, url: blob.url };
    } catch (err) {
      console.error('[upload] Blob upload failed, falling back to local disk', err.message);
    }
  }
  const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, filename), file.buffer);
  return { name: file.originalname, url: `/uploads/${filename}` };
}

async function dtoWithDev(log) {
  let devName = '';
  let initials = '';
  const devObj = log.developer;
  if (devObj && typeof devObj === 'object' && devObj.name) {
    devName = devObj.name;
    initials = devObj.initials || '';
  } else if (devObj) {
    const dev = await User.findById(devObj, 'name initials');
    if (dev) {
      devName = dev.name;
      initials = dev.initials || '';
    }
  }

  let projName = '';
  const projObj = log.project;
  if (projObj && typeof projObj === 'object' && projObj.name) {
    projName = projObj.name;
  } else if (projObj) {
    const project = await Project.findById(projObj, 'name');
    if (project) projName = project.name;
  }

  return workLogDto(log, { developerName: devName, initials, projectName: projName });
}

// ---------- GET /api/logs?date=&developerId= ----------
router.get('/', ah(async (req, res) => {
  const dateQuery = req.query.date;
  const scope = await scopeFor(req.user);
  const mongoose = require('mongoose');
  const toObjId = (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);

  const devObjectIds = (scope.developerIds || []).map(toObjId);
  const teamObjectIds = (scope.teamIds || []).map(toObjId);
  const projObjectIds = (scope.projectIds || []).map(toObjId);

  let query;
  if (req.user.role === 'developer') {
    query = { developer: toObjId(req.user._id) };
  } else if (req.query.developerId) {
    const id = String(req.query.developerId);
    const conditions = [];
    if (mongoose.Types.ObjectId.isValid(id)) {
      conditions.push({ developer: new mongoose.Types.ObjectId(id) });
      conditions.push({ developer: id });
    } else {
      const matchingUsers = await User.find({ name: new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, '_id');
      const uIds = matchingUsers.map((u) => u._id);
      if (uIds.length) {
        conditions.push({ developer: { $in: uIds } });
      } else {
        conditions.push({ developer: id });
      }
    }
    query = conditions.length > 1 ? { $or: conditions } : (conditions[0] || {});
  } else if (req.user.role === 'admin') {
    query = {};
  } else {
    const conditions = [];
    if (devObjectIds.length) conditions.push({ developer: { $in: devObjectIds } });
    if (teamObjectIds.length) conditions.push({ team: { $in: teamObjectIds } });
    if (projObjectIds.length) conditions.push({ project: { $in: projObjectIds } });
    query = conditions.length ? { $or: conditions } : {};
  }

  if (dateQuery && dateQuery !== 'all') {
    query.date = dateQuery;
  }

  const logs = await WorkLog.find(query)
    .sort({ date: -1, hourSlot: -1, submittedAt: -1 })
    .populate('developer', 'name initials')
    .populate('project', 'name');

  const dtos = [];
  for (const log of logs) {
    dtos.push(await dtoWithDev(log));
  }

  // day stats (for developer dashboards)
  let stats = null;
  const targetDate = (dateQuery && dateQuery !== 'all') ? dateQuery : dayStr();
  if (req.user.role === 'developer' || req.query.developerId) {
    const devId = req.user.role === 'developer' ? req.user._id : req.query.developerId;
    const { perDev } = await dayStats([devId], targetDate);
    const s = perDev[String(devId)];
    if (s) {
      stats = {
        activeMinutes: s.activeMinutes,
        missed: s.missed,
        hoursCovered: s.hoursCovered,
        slotsSoFar: s.slotsSoFar,
        currentSlot: s.currentSlot,
        firstSeen: s.firstSeen
      };
    }
  }

  res.json({ logs: dtos, stats });
}));

// ---------- POST /api/logs (developer hourly check-in) ----------
router.post('/', requireRole('developer'), upload.single('attachment'), ah(async (req, res) => {
  const settings = await Setting.get();
  const { projectId, taskId, task, description, status, blocker, minutes, commitUrl, moduleName } = req.body;
  const words = String(description || '').trim().split(/\s+/).filter(Boolean).length;

  if (!projectId) return res.status(400).json({ error: 'Select the project this log is for' });
  if (words < settings.minWords) {
    return res.status(400).json({ error: `Description must be at least ${settings.minWords} words (currently ${words})` });
  }
  if (!req.file) return res.status(400).json({ error: 'Screenshot proof is required' });

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  let linkedTaskObj = null;
  if (taskId) {
    linkedTaskObj = await Task.findById(taskId);
  }

  const date = dayStr();
  const hourSlot = req.body.hourSlot ? Number(req.body.hourSlot) : slotForNow(settings);

  const attachment = await saveUpload(req.file);

  let commitsCount = 0;
  let sha = '';
  if (commitUrl) {
    commitsCount = 1;
    sha = (commitUrl.split('/').pop() || '').slice(0, 7) || Math.random().toString(16).slice(2, 9);
    await Commit.create({
      developer: req.user._id, project: project._id, team: req.user.team,
      message: task || (linkedTaskObj ? linkedTaskObj.title : 'Commit linked from check-in'), branch: 'main', files: 1,
      sha, url: commitUrl, committedAt: new Date(), date
    });
  }

  const now = new Date();
  const slotEnd = new Date(now);
  slotEnd.setHours(hourSlot + 1, 0, 0, 0);
  const isLate = now.getHours() >= 17 || now > slotEnd;

  const isPendingWork = req.body.isPendingWork === 'true' || !!req.body.originalPendingDate || (linkedTaskObj && dayStr(linkedTaskObj.createdAt) !== date);
  const origPendingDate = req.body.originalPendingDate || (linkedTaskObj ? dayStr(linkedTaskObj.createdAt) : date);

  const log = await WorkLog.create({
    developer: req.user._id,
    isLate,
    team: req.user.team,
    project: project._id,
    moduleName: moduleName || (project.modules && project.modules[0] ? project.modules[0].name : ''),
    date,
    hourSlot,
    task: linkedTaskObj ? `[Assigned Task] ${linkedTaskObj.title}` : (task || description.slice(0, 60)),
    status: status || 'progress',
    description: String(description).trim(),
    submittedAt: new Date(),
    activeMinutes: Number(minutes) || 0,
    attachmentName: attachment.name || 'screenshot.png',
    attachmentUrl: attachment.url,
    commitsCount,
    commitUrl: commitUrl || '',
    review: 'pending',
    blocker: status === 'blocked' ? blocker || '' : '',
    wordCount: words,
    linkedTask: linkedTaskObj ? linkedTaskObj._id : null,
    isAssignedTask: !!linkedTaskObj,
    assignedTaskTitle: linkedTaskObj ? linkedTaskObj.title : '',
    isPendingWorkSubmission: !!isPendingWork,
    originalPendingDate: isPendingWork ? origPendingDate : '',
    pendingSubmissionAt: isPendingWork ? new Date() : null
  });

  if (linkedTaskObj) {
    linkedTaskObj.status = 'in_progress';
    linkedTaskObj.linkedLog = log._id;
    await linkedTaskObj.save();
  }

  // batch submission detection: >= threshold logs within 10 minutes
  const recent = await WorkLog.find({
    developer: req.user._id, date,
    submittedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
  }).sort({ submittedAt: 1 });
  if (recent.length >= settings.batchThreshold) {
    const dedupeKey = `batch:${req.user._id}:${date}:${hourSlot}`;
    const exists = await Alert.findOne({ dedupeKey });
    if (!exists) {
      await Alert.create({
        dedupeKey,
        audience: 'leader', team: req.user.team, project: project._id, developerId: req.user._id,
        severity: 'flag', category: 'Batch Submit', who: req.user.name,
        title: `${req.user.name} — Batch Submission`,
        body: `${recent.length} logs submitted in under 10 minutes`,
        meta: `${fmtTime(new Date())} · ${project.name} · Team`,
        detection: 'Submission timestamps compared. 3+ logs in 10 min = batch alert.',
        read: false,
        actions: ['Review Logs', 'Reject All', 'Mark Seen'],
        timeline: recent.map((l) => ({ at: fmtTime(l.submittedAt), what: `${hourLabel(l.hourSlot)} log` }))
      });
      emitToRoles(['leader'], 'alert:new', { category: 'Batch Submit', who: req.user.name });
    }
  }

  const dto = await dtoWithDev(log);
  emitToUser(String(req.user._id), 'log:new', dto);
  emitToRoles(['leader', 'manager', 'admin'], 'log:new', { ...dto, developerId: String(req.user._id) });
  res.status(201).json({ log: dto });
}));

// ---------- POST /api/logs/:id/resubmit (developer fixes targeted feedback) ----------
router.post('/:id/resubmit', requireRole('developer'), upload.single('attachment'), ah(async (req, res) => {
  const log = await WorkLog.findById(req.params.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  if (String(log.developer) !== String(req.user._id)) return res.status(403).json({ error: 'Not your log' });

  log.resubmissions.push({ text: req.body.text || 'Updated the highlighted part and attached proof.', at: new Date() });
  if (req.file) {
    const attachment = await saveUpload(req.file);
    log.attachmentName = attachment.name || log.attachmentName;
    log.attachmentUrl = attachment.url || log.attachmentUrl;
  }
  log.isPendingWorkSubmission = true;
  if (!log.originalPendingDate) {
    log.originalPendingDate = log.date;
  }
  log.pendingSubmissionAt = new Date();
  log.review = 'pending';
  await log.save();

  const dto = await dtoWithDev(log);
  emitToUser(String(req.user._id), 'log:review', dto);
  emitToUser(String(req.user._id), 'task:update', {});
  emitToRoles(['leader'], 'log:review', dto);
  res.json({ log: dto });
}));

// ---------- POST /api/logs/:id/review (leader: approve / reject) ----------
router.post('/:id/review', requireRole('leader'), ah(async (req, res) => {
  const { action, note } = req.body || {};
  const log = await WorkLog.findById(req.params.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  const scope = await scopeFor(req.user);
  if (!scope.developerIds.some((d) => String(d) === String(log.developer))) {
    return res.status(403).json({ error: 'This developer is not in your team' });
  }

  if (action === 'approve') {
    log.review = 'approved';
    log.reviewNote = note || `Approved by ${req.user.name} (Team Lead)`;
    if (log.linkedTask) {
      const taskToComplete = await Task.findById(log.linkedTask);
      if (taskToComplete) {
        taskToComplete.status = 'completed';
        await taskToComplete.save();
        emitToUser(String(log.developer), 'task:update', { taskId: String(taskToComplete._id), status: 'completed' });
        emitToRoles(['leader', 'manager'], 'task:update', { taskId: String(taskToComplete._id), status: 'completed' });
      }
    }
  } else if (action === 'reject') {
    log.review = 'rejected';
    log.reviewNote = note || 'Full resubmission requested by Team Lead.';
  } else if (action === 'reset') {
    log.review = 'pending';
    log.reviewNote = '';
  } else {
    return res.status(400).json({ error: 'Unknown review action' });
  }
  await log.save();

  if (action === 'approve' || action === 'reject') {
    await Alert.create({
      audience: 'developer', user: log.developer,
      kind: action === 'approve' ? 'approval' : 'rejection',
      unread: true,
      title: action === 'approve' ? 'Log Approved' : 'Log Rejected',
      body: `${hourLabel(log.hourSlot)} log ${action === 'approve' ? 'approved' : 'rejected'} — ${log.reviewNote}`
    });
    emitToUser(String(log.developer), 'alert:new', {});
    emitToUser(String(log.developer), 'task:update', {});
  }

  const dto = await dtoWithDev(log);
  emitToUser(String(log.developer), 'log:review', dto);
  emitToRoles(['leader', 'manager', 'admin'], 'log:review', dto);
  res.json({ log: dto });
}));

// ---------- POST /api/logs/:id/feedback (leader: targeted changes) ----------
router.post('/:id/feedback', requireRole('leader'), upload.single('screenshot'), ah(async (req, res) => {
  const { highlightedText, comment } = req.body || {};
  if (!comment || !comment.trim()) return res.status(400).json({ error: 'Feedback comment is required' });

  const log = await WorkLog.findById(req.params.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  const scope = await scopeFor(req.user);
  if (!scope.developerIds.some((d) => String(d) === String(log.developer))) {
    return res.status(403).json({ error: 'This developer is not in your team' });
  }

  const attachment = await saveUpload(req.file);
  const fb = {
    id: `fb-${Date.now()}`,
    highlightedText: (highlightedText || '').trim() || 'Log entry section',
    comment: comment.trim(),
    screenshotUrl: attachment.url || undefined,
    screenshotName: attachment.name || undefined,
    createdAt: new Date()
  };
  log.targetedFeedback.push(fb);
  log.review = 'changes_requested';
  log.reviewNote = 'Targeted changes requested by Team Lead';
  await log.save();

  await Task.create({
    title: `Fix highlighted part: ${fb.highlightedText.slice(0, 60)}`,
    note: fb.comment,
    priority: 'high',
    dueDate: 'Today',
    assignee: log.developer,
    assignedBy: req.user._id,
    assignedByRole: 'TL',
    assignedByName: req.user.name,
    status: 'pending',
    type: 'targeted_feedback',
    highlightedText: fb.highlightedText,
    linkedLog: log._id
  });

  await Alert.create({
    audience: 'developer', user: log.developer, kind: 'rejection', unread: true,
    title: 'Changes Requested',
    body: `${hourLabel(log.hourSlot)} log — ${fb.comment}`
  });

  const dto = await dtoWithDev(log);
  emitToUser(String(log.developer), 'log:review', dto);
  emitToUser(String(log.developer), 'task:update', {});
  emitToUser(String(log.developer), 'alert:new', {});
  emitToRoles(['leader', 'manager', 'admin'], 'log:review', dto);
  res.json({ log: dto });
}));

// ---------- GET /api/logs/calendar?month=YYYY-MM (developer monthly widget) ----------
router.get('/calendar', ah(async (req, res) => {
  const me = req.user.role === 'developer' ? req.user._id : req.query.developerId || req.user._id;
  const devUser = await User.findById(me, 'joinedAt');
  const joinedDate = devUser?.joinedAt || (devUser?._id ? devUser._id.getTimestamp() : new Date());
  const joinedStr = new Date(joinedDate).toISOString().slice(0, 10);

  const [y, m] = (req.query.month || dayStr().slice(0, 7)).split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const settings = await Setting.get();
  const todayStr = dayStr();

  const logs = await WorkLog.find({
    developer: me,
    date: { $gte: `${y}-${String(m).padStart(2, '0')}-01`, $lte: `${y}-${String(m).padStart(2, '0')}-${daysInMonth}` }
  }).sort({ hourSlot: 1 });
  const eods = await (require('../models')).EodReport.find({
    developer: me,
    date: { $gte: `${y}-${String(m).padStart(2, '0')}-01`, $lte: `${y}-${String(m).padStart(2, '0')}-${daysInMonth}` }
  });

  const required = requiredSlots(settings);
  const days = [];
  for (let dnum = 1; dnum <= daysInMonth; dnum++) {
    const ds = `${y}-${String(m).padStart(2, '0')}-${String(dnum).padStart(2, '0')}`;
    const date = new Date(y, m - 1, dnum);
    const dow = date.getDay();
    const dayLogs = logs.filter((l) => l.date === ds);
    const eod = eods.find((e) => e.date === ds);
    let status;
    if (dow === 0 || dow === 6) status = 'weekend';
    else if (ds < joinedStr) status = 'off';
    else if (dayLogs.length === 0) {
      if (ds > todayStr) status = 'off';
      else if (ds === todayStr) status = 'pending';
      else status = 'absent';
    } else {
      const hasUnresolved = dayLogs.some((l) => l.review !== 'approved');
      status = !hasUnresolved && eod ? 'approved' : 'pending';
    }
    days.push({
      dateNum: dnum,
      dateStr: ds,
      fullLabel: `${ds === todayStr ? fmtDateMDY(date) + ' (Today)' : fmtDateMDY(date)}`,
      status,
      tasksCount: dayLogs.length,
      approvedCount: dayLogs.filter((l) => l.review === 'approved').length,
      pendingCount: dayLogs.filter((l) => l.review !== 'approved').length,
      activeTime: fmtDuration(dayLogs.reduce((s, l) => s + (l.activeMinutes || 0), 0)),
      notes: dayLogs.some((l) => l.review !== 'approved')
        ? `${dayLogs.filter((l) => l.review !== 'approved').length} task(s) require action / resubmission.`
        : undefined,
      tasks: dayLogs.slice(0, 4).map((l) => ({
        id: String(l._id),
        title: l.task,
        status: l.status,
        review: l.review,
        hourLabel: hourLabel(l.hourSlot),
        tlNote: l.targetedFeedback && l.targetedFeedback.length
          ? l.targetedFeedback[l.targetedFeedback.length - 1].comment
          : undefined
      }))
    });
  }
  res.json({ days });
}));

// ---------- GET /api/logs/pending-works (developer resubmission & task queue) ----------
router.get('/pending-works', requireRole('developer'), ah(async (req, res) => {
  const devUser = await User.findById(req.user._id).populate('team');
  const userTeam = devUser && devUser.team && typeof devUser.team === 'object' ? devUser.team : null;
  const userProjectId = userTeam && userTeam.project ? String(userTeam.project) : '';

  // 1. WorkLogs that are revisions requested OR currently marked in_progress / blocked (not yet done & approved)
  const logs = await WorkLog.find({
    developer: req.user._id,
    $or: [
      { review: { $in: ['changes_requested', 'rejected'] } },
      { status: { $in: ['progress', 'blocked'] } }
    ]
  }).sort({ date: -1, hourSlot: 1 }).populate('project', 'name');

  const items = [];
  const handledLogIds = new Set();
  const handledTaskIds = new Set();

  for (const log of logs) {
    // If a log is marked 'done' and 'approved', it is completely finished -> skip
    if (log.status === 'done' && log.review === 'approved') continue;

    handledLogIds.add(String(log._id));
    if (log.linkedTask) handledTaskIds.add(String(log.linkedTask));

    const fb = log.targetedFeedback && log.targetedFeedback.length
      ? log.targetedFeedback[log.targetedFeedback.length - 1]
      : null;
    
    const isRevision = ['changes_requested', 'rejected'].includes(log.review);
    const isSubmittedPending = log.review === 'pending' && log.status === 'done';

    items.push({
      kind: 'log',
      id: String(log._id),
      logId: String(log._id),
      projectId: log.project ? String(log.project._id || log.project) : userProjectId,
      dateStr: fmtDateMDY(new Date(`${log.date}T12:00:00`)),
      taskTitle: log.task,
      hourLabel: `${hourLabel(log.hourSlot)} Slot`,
      assignedBy: isRevision ? 'Team Lead' : 'Self (Check-in)',
      assignerRole: 'TL',
      highlightedText: fb ? fb.highlightedText : undefined,
      feedbackNote: fb
        ? fb.comment
        : log.reviewNote
        ? log.reviewNote
        : log.status === 'blocked'
        ? `Blocker: ${log.blocker || 'Blocked'}`
        : log.description,
      screenshotUrl: fb && fb.screenshotUrl ? fb.screenshotUrl : (log.attachmentUrl || undefined),
      screenshotName: fb && fb.screenshotName ? fb.screenshotName : (log.attachmentName || undefined),
      status: isRevision
        ? 'changes_requested'
        : isSubmittedPending
        ? 'awaiting_lead_approval'
        : log.status === 'blocked'
        ? 'blocked'
        : 'in_progress'
    });
  }

  // 2. Assigned Tasks (in progress, pending submission, or awaiting lead approval)
  const tasks = await Task.find({
    assignee: req.user._id,
    status: { $ne: 'completed' },
    type: { $ne: 'targeted_feedback' }
  }).populate('linkedLog').sort({ createdAt: -1 });

  for (const t of tasks) {
    if (handledTaskIds.has(String(t._id))) continue;
    if (t.linkedLog) {
      if (handledLogIds.has(String(t.linkedLog._id || t.linkedLog))) continue;
      // If developer already submitted log as done and lead approved it, skip
      if (t.linkedLog.review === 'approved' && t.linkedLog.status === 'done') continue;
    }

    const isSubmittedPending = t.linkedLog && t.linkedLog.review === 'pending';
    const isChangesRequested = t.linkedLog && ['changes_requested', 'rejected'].includes(t.linkedLog.review);

    items.push({
      kind: 'task',
      id: String(t._id),
      taskId: String(t._id),
      projectId: userProjectId,
      dateStr: fmtDateMDY(t.createdAt),
      taskTitle: t.title,
      hourLabel: isSubmittedPending ? 'Awaiting Approval' : 'Assigned Task',
      assignedBy: t.assignedByName,
      assignerRole: t.assignedByRole,
      feedbackNote: isSubmittedPending
        ? 'Work log submitted. Waiting for Team Lead review and approval.'
        : (t.note || 'Task assigned manually by lead.'),
      status: isSubmittedPending ? 'awaiting_lead_approval' : isChangesRequested ? 'changes_requested' : 'pending_submission'
    });
  }

  res.json({ items });
}));

// ---------- GET /api/logs/team-calendar?month=YYYY-MM ----------
router.get('/team-calendar', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const mongoose = require('mongoose');

  const candidateDevIds = new Set((scope.developerIds || []).map(String));
  if (scope.teamIds && scope.teamIds.length) {
    const teamDevs = await User.find({ role: 'developer', active: { $ne: false }, team: { $in: scope.teamIds } }, '_id');
    teamDevs.forEach((d) => candidateDevIds.add(String(d._id)));
  }
  if (req.user.team) {
    const ownTeamDevs = await User.find({ role: 'developer', active: { $ne: false }, team: req.user.team }, '_id');
    ownTeamDevs.forEach((d) => candidateDevIds.add(String(d._id)));
  }
  if (scope.projectIds && scope.projectIds.length) {
    const projectDevs = await WorkLog.distinct('developer', { project: { $in: scope.projectIds } });
    projectDevs.forEach((d) => candidateDevIds.add(String(d)));
  }

  let devQuery = { role: 'developer', active: { $ne: false } };
  if (candidateDevIds.size > 0 && req.user.role === 'leader') {
    const validIds = Array.from(candidateDevIds).filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
    if (validIds.length) devQuery._id = { $in: validIds };
  }

  let developers = await User.find(devQuery, '_id name initials email jobTitle lastSeenAt').sort({ name: 1 });
  if (!developers.length) {
    developers = await User.find({ role: 'developer', active: { $ne: false } }, '_id name initials email jobTitle lastSeenAt').sort({ name: 1 });
  }

  const devMap = {};
  developers.forEach((d) => {
    devMap[String(d._id)] = d;
  });

  const settings = await Setting.get();
  const reqSlots = requiredSlots(settings);
  const totalRequiredSlots = reqSlots.length;

  const now = new Date();
  const todayStr = dayStr(now);

  // Month param (format YYYY-MM)
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-12
  if (req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)) {
    const parts = req.query.month.split('-').map(Number);
    year = parts[0];
    month = parts[1];
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStartStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEndStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  // Fetch all logs for this month
  const allMonthLogs = await WorkLog.find({
    date: { $gte: monthStartStr, $lte: monthEndStr }
  }).populate('developer', 'name initials email jobTitle').populate('project', 'name').sort({ date: 1, hourSlot: 1 });

  // Fetch all tasks created in or relevant to this month
  const allTasks = await Task.find({
    status: { $ne: 'completed' }
  }).populate('assignee', 'name initials').populate('linkedLog').sort({ createdAt: -1 });

  const currentSlot = slotForNow(settings, now);
  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayObj = fromDayStr(dStr);
    const isWork = isWorkday(dayObj, settings);
    const isToday = dStr === todayStr;
    const isPast = dStr < todayStr;
    const isFuture = dStr > todayStr;

    const dayLogs = allMonthLogs.filter((l) => l.date === dStr);
    const unsubmittedDevelopers = [];
    const submittedDevelopers = [];

    // Applicable slots: on today, slots up to currentSlot; on past workdays, all required slots
    const dayApplicableSlots = isToday ? reqSlots.filter((s) => s <= currentSlot) : reqSlots;
    const dayRequiredCount = dayApplicableSlots.length || totalRequiredSlots;

    // Group logs by developer
    for (const dev of developers) {
      const devLogs = dayLogs.filter((l) => {
        const devId = l.developer && typeof l.developer === 'object' ? String(l.developer._id || l.developer) : String(l.developer);
        return devId === String(dev._id) || (l.developer && l.developer.name && l.developer.name.toLowerCase() === dev.name.toLowerCase());
      });
      const submittedCount = devLogs.length;
      const submittedSlots = devLogs.map((l) => l.hourSlot);
      const missedSlotsNums = dayApplicableSlots.filter((s) => !submittedSlots.includes(s));
      const missedSlotsLabels = missedSlotsNums.map((s) => hourLabel(s));
      const activeMin = devLogs.reduce((acc, l) => acc + (l.activeMinutes || 0), 0);

      if ((isPast || isToday) && isWork) {
        if (submittedCount < dayRequiredCount || missedSlotsNums.length > 0) {
          unsubmittedDevelopers.push({
            developerId: String(dev._id),
            developerName: dev.name,
            initials: dev.initials || initialsOf(dev.name),
            email: dev.email,
            jobTitle: dev.jobTitle || 'Developer',
            missedCount: missedSlotsNums.length,
            missedSlots: missedSlotsLabels,
            submittedCount,
            totalRequired: dayRequiredCount,
            activeMinutes: activeMin,
            lastSeenAt: dev.lastSeenAt,
            status: submittedCount === 0 ? 'Not Submitted' : 'Partially Submitted'
          });
        }
      }

      if (submittedCount > 0) {
        submittedDevelopers.push({
          developerId: String(dev._id),
          developerName: dev.name,
          initials: dev.initials || initialsOf(dev.name),
          email: dev.email,
          jobTitle: dev.jobTitle || 'Developer',
          submittedCount,
          totalRequired: dayRequiredCount,
          activeMinutes: activeMin,
          lastSeenAt: dev.lastSeenAt,
          status: submittedCount >= dayRequiredCount ? 'Fully Submitted' : 'Partially Submitted'
        });
      }
    }

    // Pending works for this date
    const pendingWorks = [];

    // 1. Logs requiring attention / pending approval / blocked / changes requested
    for (const log of dayLogs) {
      const isReviewPending = log.review === 'pending';
      const isChangesReq = ['changes_requested', 'rejected'].includes(log.review);
      const isBlocked = log.status === 'blocked';
      const isProgress = log.status === 'progress';

      if (isReviewPending || isChangesReq || isBlocked || isProgress) {
        const logDevId = log.developer && typeof log.developer === 'object' ? String(log.developer._id || log.developer) : String(log.developer);
        const dev = devMap[logDevId] || (log.developer && log.developer.name ? log.developer : { name: 'Developer', initials: 'DV' });
        pendingWorks.push({
          id: String(log._id),
          kind: 'log',
          developerId: logDevId,
          developerName: dev.name,
          initials: dev.initials || initialsOf(dev.name),
          taskTitle: log.task,
          projectName: log.project ? log.project.name : 'Project',
          hourLabel: `${hourLabel(log.hourSlot)} Slot`,
          status: isChangesReq
            ? 'changes_requested'
            : isReviewPending
            ? 'awaiting_lead_approval'
            : isBlocked
            ? 'blocked'
            : 'in_progress',
          review: log.review,
          feedbackNote: log.reviewNote || log.blocker || log.description || '',
          attachmentUrl: log.attachmentUrl || '',
          attachmentName: log.attachmentName || '',
          isPendingWorkSubmission: !!log.isPendingWorkSubmission,
          originalPendingDate: log.originalPendingDate || '',
          pendingSubmissionAt: log.pendingSubmissionAt || null,
          submittedAt: log.submittedAt
        });
      }
    }

    // 2. Tasks active on this date
    for (const t of allTasks) {
      const assigneeId = t.assignee && typeof t.assignee === 'object' ? String(t.assignee._id || t.assignee) : String(t.assignee);
      const dev = devMap[assigneeId] || (t.assignee && t.assignee.name ? t.assignee : { name: t.assignedByName || 'Developer', initials: 'DV' });
      const tCreatedStr = t.createdAt ? dayStr(t.createdAt) : '';
      const tDueStr = t.dueDate || '';

      if (tCreatedStr === dStr || tDueStr === dStr || isToday) {
        pendingWorks.push({
          id: String(t._id),
          kind: 'task',
          developerId: assigneeId,
          developerName: dev.name,
          initials: dev.initials || initialsOf(dev.name),
          taskTitle: t.title,
          projectName: 'Assigned Task',
          hourLabel: 'Assigned Task',
          status: t.status === 'in_progress' ? 'in_progress' : 'pending_submission',
          review: 'pending',
          feedbackNote: t.note || 'Assigned task by lead',
          attachmentUrl: '',
          attachmentName: '',
          isPendingWorkSubmission: false,
          originalPendingDate: '',
          pendingSubmissionAt: null,
          submittedAt: t.createdAt
        });
      }
    }

    let dayStatus = 'completed';
    if (isFuture) {
      dayStatus = 'future';
    } else if (!isWork && dayLogs.length === 0) {
      dayStatus = 'weekend';
    } else if (unsubmittedDevelopers.length > 0) {
      dayStatus = 'attention';
    } else if (pendingWorks.length > 0) {
      dayStatus = 'pending';
    }

    days.push({
      dateNum: d,
      dateStr: dStr,
      fullLabel: fmtDateLong(dayObj),
      dayOfWeek: dayObj.getDay(),
      isWorkday: isWork,
      isToday,
      isPast,
      isFuture,
      status: dayStatus,
      unsubmittedCount: unsubmittedDevelopers.length,
      pendingWorksCount: pendingWorks.length,
      totalLogsCount: dayLogs.length,
      unsubmittedDevelopers,
      submittedDevelopers,
      pendingWorks,
      logs: dayLogs.map((l) => {
        const logDevId = l.developer && typeof l.developer === 'object' ? String(l.developer._id || l.developer) : String(l.developer);
        const dev = devMap[logDevId] || (l.developer && l.developer.name ? l.developer : { name: 'Developer', initials: 'DV' });
        return {
          id: String(l._id),
          developerId: logDevId,
          developerName: dev.name,
          initials: dev.initials || initialsOf(dev.name),
          taskTitle: l.task,
          projectName: l.project ? l.project.name : 'Project',
          hourLabel: `${hourLabel(l.hourSlot)} Slot`,
          status: l.status,
          review: l.review,
          description: l.description,
          attachmentUrl: l.attachmentUrl || '',
          attachmentName: l.attachmentName || '',
          activeMinutes: l.activeMinutes || 0,
          submittedAt: l.submittedAt
        };
      })
    });
  }

  res.json({
    month: `${year}-${String(month).padStart(2, '0')}`,
    year,
    monthNum: month,
    totalDevelopers: developers.length,
    developers: developers.map((d) => ({
      id: String(d._id),
      name: d.name,
      initials: d.initials || initialsOf(d.name),
      email: d.email,
      jobTitle: d.jobTitle || 'Developer'
    })),
    requiredSlotsCount: totalRequiredSlots,
    days
  });
}));

module.exports = router;



