const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Project, Team, User, WorkLog, Task, Setting } = require('../models');
const { authRequired, attachUser, requireRole, ah } = require('../middleware/auth');
const { projectDto } = require('../util/dto');
const { scopeFor } = require('../util/scope');
const { dayStr, addDays, fmtDuration, initialsOf } = require('../util/time');
const { emitToRoles } = require('../sockets');

const router = express.Router();
router.use(authRequired, attachUser);

// ======================= PROJECTS =======================

async function projectStats(project, team) {
  const since = dayStr(addDays(new Date(), -7));
  const today = dayStr();
  const memberIds = team ? team.members : [];

  const [doneCount, blockedCount, progressLogs, activeDevs] = await Promise.all([
    WorkLog.countDocuments({ project: project._id, status: 'done' }),
    WorkLog.countDocuments({ project: project._id, status: 'blocked', date: { $gte: since } }),
    WorkLog.countDocuments({ project: project._id, status: 'progress', date: { $gte: since } }),
    memberIds.length
      ? User.countDocuments({
          _id: { $in: memberIds },
          lastSeenAt: { $gte: new Date(Date.now() - 45 * 60 * 1000) }
        })
      : Promise.resolve(0)
  ]);

  const progress = project.status === 'completed'
    ? 100
    : Math.min(100, Math.round((doneCount / (project.plannedTasks || 40)) * 100));
  let health = 'On Track';
  if (project.status === 'completed') {
    health = project.targetDate && project.endedAt && project.endedAt <= project.targetDate
      ? 'Delivered on time'
      : 'Behind';
  } else if (progress < 40) health = 'Behind';
  else if (progress < 65) health = 'Slightly Behind';

  return { progress, health, tasksDone: doneCount, blockers: blockedCount, activeDevs, inProgress: progressLogs };
}

async function fullProjectDto(project) {
  const team = project.team && project.team.members
    ? project.team
    : await Team.findById(project.team).populate('leader', 'name').populate('members', 'name');
  const manager = project.manager && project.manager.name
    ? project.manager
    : await User.findById(project.manager, 'name');
  const stats = await projectStats(project, team);
  return projectDto({ ...project.toObject(), manager }, team, stats);
}

// GET /api/projects?scope=mine|all
router.get('/projects', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const filter = req.query.scope === 'all' && req.user.role === 'admin'
    ? {}
    : { team: { $in: scope.teamIds } };
  const projects = await Project.find(filter)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  const dtos = [];
  for (const p of projects) dtos.push(await fullProjectDto(p));
  res.json({ projects: dtos });
}));

// POST /api/projects — manager creates project + team in one step
router.post('/projects', requireRole('manager', 'admin'), ah(async (req, res) => {
  const { name, description, startedAt, targetDate, repoUrl, status, teamName, leaderId, developerIds } = req.body || {};
  if (!name || !teamName || !leaderId || !developerIds || !developerIds.length) {
    return res.status(400).json({ error: 'Project name, team name, leader and at least one developer are required' });
  }
  const leader = await User.findById(leaderId);
  if (!leader || leader.role !== 'leader') return res.status(400).json({ error: 'Select a valid team leader' });

  const team = await Team.create({ name: teamName, leader: leaderId, members: [...new Set(developerIds.map(String))] });
  const project = await Project.create({
    name,
    description: description || '',
    status: status || 'ongoing',
    manager: req.user._id,
    team: team._id,
    repoUrl: repoUrl || '',
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    targetDate: targetDate ? new Date(targetDate) : null,
    plannedTasks: 40
  });
  team.project = project._id;
  await team.save();
  await User.updateMany({ _id: { $in: developerIds } }, { team: team._id });
  await User.findByIdAndUpdate(leaderId, { team: team._id });

  const populated = await Project.findById(project._id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:new', { projectId: String(project._id) });
  res.status(201).json({ project: await fullProjectDto(populated) });
}));

// GET /api/projects/:id/overview — weekly breakdown + live blockers
router.get('/projects/:id/overview', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const project = await Project.findById(req.params.id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!scope.teamIds.some((t) => String(t) === String(project.team._id || project.team))) {
    return res.status(403).json({ error: 'Not in your scope' });
  }

  const weeks = [];
  for (let w = 4; w >= 0; w--) {
    const start = addDays(new Date(), -(w * 7 + 6));
    const end = addDays(new Date(), -(w * 7));
    const startStr = dayStr(start);
    const endStr = dayStr(end);
    const logs = await WorkLog.find({
      project: project._id,
      date: { $gte: startStr, $lte: endStr }
    });
    const tasks = logs.filter((l) => l.status === 'done').length;
    const blockers = logs.filter((l) => l.status === 'blocked').length;
    weeks.push({
      label: w === 0 ? 'This Week' : `Week ${5 - w}`,
      tasks,
      blockers,
      health: blockers >= 3 ? 'Behind' : blockers >= 1 ? 'Slow' : 'Good'
    });
  }

  const blockedLogs = await WorkLog.find({ project: project._id, status: 'blocked' })
    .sort({ date: -1 })
    .limit(10)
    .populate('developer', 'name');
  const blockers = blockedLogs.map((l) => ({
    id: String(l._id),
    title: l.blocker || l.task,
    since: `Since ${l.date}`,
    team: project.team.name,
    state: 'Unresolved'
  }));

  res.json({
    project: await fullProjectDto(project),
    weeks,
    blockers
  });
}));

// ======================= DIRECTORY (manager/admin) =======================

// GET /api/directory — leaders & developers available for team building
router.get('/directory', requireRole('manager', 'admin'), ah(async (_req, res) => {
  const users = await User.find({ role: { $in: ['leader', 'developer'] }, active: true })
    .populate('team', 'name');
  res.json({
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      role: u.role,
      initials: u.initials,
      teamName: u.team && typeof u.team === 'object' ? u.team.name : ''
    }))
  });
}));

// ======================= TEAMS =======================

// GET /api/teams
router.get('/teams', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const teams = await Team.find({ _id: { $in: scope.teamIds } })
    .populate('leader', 'name initials email')
    .populate('members', 'name initials email role')
    .populate('project', 'name');
  res.json({
    teams: teams.map((t) => ({
      id: String(t._id),
      name: t.name,
      project: t.project ? t.project.name : '',
      leader: t.leader ? { id: String(t.leader._id), name: t.leader.name, initials: t.leader.initials } : null,
      members: (t.members || []).map((m) => ({ id: String(m._id), name: m.name, initials: m.initials, email: m.email }))
    }))
  });
}));

// PATCH /api/teams/:id — change leader, add/remove member
router.patch('/teams/:id', requireRole('manager', 'admin'), ah(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  if (req.body.leaderId) {
    const leader = await User.findById(req.body.leaderId);
    if (!leader || leader.role !== 'leader') return res.status(400).json({ error: 'Select a valid team leader' });
    team.leader = leader._id;
    leader.team = team._id;
    await leader.save();
  }
  if (req.body.addMemberId) {
    if (!team.members.some((m) => String(m) === String(req.body.addMemberId))) {
      team.members.push(req.body.addMemberId);
      await User.findByIdAndUpdate(req.body.addMemberId, { team: team._id });
    }
  }
  if (req.body.removeMemberId) {
    team.members = team.members.filter((m) => String(m) !== String(req.body.removeMemberId));
  }
  await team.save();

  const populated = await Team.findById(team._id)
    .populate('leader', 'name initials')
    .populate('members', 'name initials email')
    .populate('project', 'name');
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'team:update', { teamId: String(team._id) });
  res.json({
    team: {
      id: String(populated._id),
      name: populated.name,
      project: populated.project ? populated.project.name : '',
      leader: populated.leader ? { id: String(populated.leader._id), name: populated.leader.name, initials: populated.leader.initials } : null,
      members: (populated.members || []).map((m) => ({ id: String(m._id), name: m.name, initials: m.initials, email: m.email }))
    }
  });
}));

// ======================= USERS (admin) =======================

// PATCH /api/users/profile — any logged-in user updates own name/github
router.patch('/users/profile', ah(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.body.name) {
    user.name = req.body.name;
    user.initials = initialsOf(req.body.name);
  }
  if (typeof req.body.github === 'string') user.github = req.body.github;
  await user.save();
  res.json({ ok: true });
}));

// PATCH /api/users/password — any logged-in user changes own password
router.patch('/users/password', ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Current password and a new password (min 6 chars) are required' });
  }
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();
  res.json({ ok: true });
}));

// GET /api/users
router.get('/users', requireRole('admin'), ah(async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      initials: u.initials,
      email: u.email,
      role: u.role,
      active: u.active,
      joined: u.joinedAt ? u.joinedAt.toDateString().slice(4) : ''
    }))
  });
}));

// POST /api/users — add user
router.post('/users', requireRole('admin'), ah(async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !role) return res.status(400).json({ error: 'Name, email and role are required' });
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ error: 'A user with this email already exists' });
  const hash = await bcrypt.hash(password || 'devtrack@2026', 10);
  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    passwordHash: hash,
    role,
    initials: initialsOf(name)
  });
  emitToRoles(['admin'], 'user:new', {});
  res.status(201).json({
    user: { id: String(user._id), name: user.name, initials: user.initials, email: user.email, role: user.role, active: user.active, joined: user.joinedAt.toDateString().slice(4) }
  });
}));

// PATCH /api/users/:id — activate/deactivate/role change
router.patch('/users/:id', requireRole('admin'), ah(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (typeof req.body.active === 'boolean') user.active = req.body.active;
  if (req.body.role && ['developer', 'leader', 'manager', 'admin'].includes(req.body.role)) user.role = req.body.role;
  if (req.body.name) {
    user.name = req.body.name;
    user.initials = initialsOf(req.body.name);
  }
  await user.save();
  emitToRoles(['admin'], 'user:update', { id: String(user._id) });
  res.json({ ok: true });
}));

// DELETE /api/users/:id
router.delete('/users/:id', requireRole('admin'), ah(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  await User.findByIdAndDelete(req.params.id);
  emitToRoles(['admin'], 'user:update', { id: req.params.id });
  res.json({ ok: true });
}));

// ======================= SETTINGS (admin) =======================

router.get('/settings', requireRole('admin'), ah(async (_req, res) => {
  res.json({ settings: await Setting.get() });
}));

router.put('/settings', requireRole('admin'), ah(async (req, res) => {
  const settings = await Setting.get();
  const allowed = ['workStartHour', 'workEndHour', 'workEndMinute', 'workDays', 'intervalMinutes', 'minWords', 'graceMinutes', 'idleMinutes', 'batchThreshold', 'notifications', 'eodDeadline'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  }
  await settings.save();
  res.json({ settings });
}));

// ======================= UPLOAD =======================
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });

router.post('/upload', upload.single('file'), ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = require('@vercel/blob');
      const blob = await put(`devtrack/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return res.json({ url: blob.url, name: req.file.originalname });
    } catch (err) {
      console.error('[upload] Blob failed, saving locally', err.message);
    }
  }
  const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, filename), req.file.buffer);
  res.json({ url: `/uploads/${filename}`, name: req.file.originalname });
}));

module.exports = router;
