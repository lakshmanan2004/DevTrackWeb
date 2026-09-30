const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { WorkLog, Commit, Task, Alert, Team, Project, User, Setting } = require('../models');
const { authRequired, attachUser, requireRole, ah } = require('../middleware/auth');
const { workLogDto, dayStats } = require('../util/dto');
const { scopeFor } = require('../util/scope');
const { dayStr, slotForNow, hourLabel, fmtTime, fmtDateMDY, requiredSlots, fmtDuration } = require('../util/time');
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
  const dev = await User.findById(log.developer, 'name initials');
  const project = log.project ? await Project.findById(log.project, 'name') : null;
  return workLogDto(log, { developerName: dev ? dev.name : '', initials: dev ? dev.initials : '', projectName: project ? project.name : '' });
}

// ---------- GET /api/logs?date=&developerId= ----------
router.get('/', ah(async (req, res) => {
  const dateQuery = req.query.date;
  const scope = await scopeFor(req.user);

  let developerFilter;
  if (req.user.role === 'developer') {
    developerFilter = req.user._id;
  } else if (req.query.developerId) {
    const id = String(req.query.developerId);
    if (!scope.developerIds.some((d) => String(d) === id)) {
      return res.status(403).json({ error: 'This developer is not in your scope' });
    }
    developerFilter = id;
  } else {
    developerFilter = { $in: scope.developerIds };
  }

  const query = { developer: developerFilter };
  if (dateQuery && dateQuery !== 'all') {
    query.date = dateQuery;
  } else if (req.user.role === 'developer' && !dateQuery) {
    query.date = dayStr();
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
  if (req.user.role === 'developer' || req.query.developerId) {
    const devId = req.user.role === 'developer' ? req.user._id : req.query.developerId;
    const { perDev } = await dayStats([devId], date);
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
    assignedTaskTitle: linkedTaskObj ? linkedTaskObj.title : ''
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

module.exports = router;
