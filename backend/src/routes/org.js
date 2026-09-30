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

  let progress = 0;
  if (project.status === 'completed') {
    progress = 100;
  } else if (project.modules && project.modules.length > 0) {
    const completedWeight = project.modules
      .filter((m) => m.status === 'completed')
      .reduce((acc, m) => acc + (m.weightPercentage || 0), 0);
    progress = Math.min(100, Math.round(completedWeight));
  } else {
    progress = Math.min(100, Math.round((doneCount / (project.plannedTasks || 40)) * 100));
  }

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
  if (!project.modules || project.modules.length === 0) {
    project.modules = [
      { name: 'UI & Wireframe Design', description: 'Design mockups, wireframes & user experience flows', weightPercentage: 20, status: project.status === 'completed' ? 'completed' : 'completed' },
      { name: 'Frontend Implementation', description: 'React screens, components & responsive layout', weightPercentage: 30, status: project.status === 'completed' ? 'completed' : 'in_progress' },
      { name: 'Backend & API Integration', description: 'Database schema, authentication & REST API endpoints', weightPercentage: 35, status: project.status === 'completed' ? 'completed' : 'todo' },
      { name: 'QA & Final Deployment', description: 'Testing, bug fixes and cloud deployment', weightPercentage: 15, status: project.status === 'completed' ? 'completed' : 'todo' }
    ];
    try {
      await project.save();
    } catch (_err) {
      /* ignore save error if read-only */
    }
  }

  const team = project.team && project.team.members
    ? project.team
    : await Team.findById(project.team).populate('leader', 'name').populate('members', 'name');
  const manager = project.manager && project.manager.name
    ? project.manager
    : await User.findById(project.manager, 'name');
  const stats = await projectStats(project, team);

  const projectLogs = await WorkLog.find({ project: project._id }).populate('developer', 'name initials');
  const projectObj = project.toObject();

  if (projectObj.modules) {
    projectObj.modules = projectObj.modules.map((m) => {
      const matched = projectLogs.filter(
        (l) => l.moduleName === m.name || String(l.moduleName).toLowerCase() === String(m.name).toLowerCase()
      );
      return {
        ...m,
        logsCount: matched.length,
        totalMinutes: matched.reduce((acc, l) => acc + (l.activeMinutes || 0), 0),
        submittedLogs: matched.map((l) => ({
          id: String(l._id),
          developerName: l.developer ? l.developer.name : 'Developer',
          initials: l.developer ? l.developer.initials : 'DV',
          description: l.description,
          task: l.task,
          status: l.status,
          submittedAt: l.submittedAt ? new Date(l.submittedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
          activeMinutes: l.activeMinutes || 0,
          attachmentUrl: l.attachmentUrl || '',
          commitUrl: l.commitUrl || '',
          review: l.review || 'pending'
        }))
      };
    });
  }

  return projectDto({ ...projectObj, manager }, team, stats);
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

// POST /api/projects — manager creates project + team + modules in one step
router.post('/projects', requireRole('manager', 'admin'), ah(async (req, res) => {
  const { name, description, startedAt, targetDate, repoUrl, status, teamName, leaderId, developerIds, modules } = req.body || {};
  if (!name || !teamName || !leaderId || !developerIds || !developerIds.length) {
    return res.status(400).json({ error: 'Project name, team name, leader and at least one developer are required' });
  }
  const leader = await User.findById(leaderId);
  if (!leader || leader.role !== 'leader') return res.status(400).json({ error: 'Select a valid team leader' });

  // Enforce single-project rule for developers
  const alreadyAssigned = await User.find({
    _id: { $in: developerIds },
    team: { $ne: null }
  }).populate('team', 'name');

  if (alreadyAssigned.length > 0) {
    const names = alreadyAssigned.map((u) => u.name).join(', ');
    return res.status(400).json({
      error: `Developer(s) ${names} are already assigned to another project team. A developer can only work on one project.`
    });
  }

  const formattedModules = Array.isArray(modules)
    ? modules.map((m) => ({
        name: m.name,
        description: m.description || '',
        weightPercentage: Number(m.weightPercentage) || 0,
        status: m.status || 'todo'
      }))
    : [];

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
    plannedTasks: 40,
    modules: formattedModules
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

// PATCH /api/projects/:id/modules/:moduleId — Leader/Manager updates module status
router.patch('/projects/:id/modules/:moduleId', ah(async (req, res) => {
  const { status } = req.body || {};
  if (!['todo', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid module status' });
  }

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const module = project.modules.id(req.params.moduleId);
  if (!module) return res.status(404).json({ error: 'Module not found' });

  module.status = status;
  if (status === 'completed') {
    const devLogsCount = await WorkLog.countDocuments({
      project: project._id,
      moduleName: { $regex: new RegExp(`^${module.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (devLogsCount === 0) {
      return res.status(400).json({
        error: `Cannot complete "${module.name}": At least 1 developer work log must be submitted for this module first.`
      });
    }
    module.completedAt = new Date();
    module.completedBy = req.user._id;
  } else {
    module.completedAt = null;
    module.completedBy = null;
  }

  const allDone = project.modules.length > 0 && project.modules.every((m) => m.status === 'completed');
  if (allDone) {
    project.status = 'completed';
    project.endedAt = new Date();
  } else if (project.status === 'completed' && !allDone) {
    project.status = 'ongoing';
    project.endedAt = null;
  }

  await project.save();

  const populated = await Project.findById(project._id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:update', { projectId: String(project._id) });
  res.json({ project: await fullProjectDto(populated) });
}));

// PATCH /api/projects/:id/status — Leader/Manager/Admin updates project overall status
router.patch('/projects/:id/status', ah(async (req, res) => {
  const { status } = req.body || {};
  if (!['ongoing', 'completed', 'hold'].includes(status)) {
    return res.status(400).json({ error: 'Invalid project status. Must be ongoing, completed, or hold' });
  }

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  project.status = status;
  if (status === 'completed') {
    project.endedAt = new Date();
    if (project.modules && project.modules.length > 0) {
      for (const mod of project.modules) {
        mod.status = 'completed';
        if (!mod.completedAt) mod.completedAt = new Date();
        if (!mod.completedBy) mod.completedBy = req.user._id;
      }
    }
  } else if (status === 'ongoing' || status === 'hold') {
    project.endedAt = null;
  }

  await project.save();

  const populated = await Project.findById(project._id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:update', { projectId: String(project._id) });
  res.json({ project: await fullProjectDto(populated) });
}));

// PATCH /api/projects/:id — Manager/Admin updates project details
router.patch('/projects/:id', requireRole('manager', 'admin'), ah(async (req, res) => {
  const { status, name, description, targetDate } = req.body || {};
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (targetDate !== undefined) project.targetDate = targetDate ? new Date(targetDate) : null;
  if (status) {
    if (!['ongoing', 'completed', 'hold'].includes(status)) {
      return res.status(400).json({ error: 'Invalid project status' });
    }
    project.status = status;
    if (status === 'completed') {
      project.endedAt = new Date();
      if (project.modules && project.modules.length > 0) {
        for (const mod of project.modules) {
          mod.status = 'completed';
          if (!mod.completedAt) mod.completedAt = new Date();
          if (!mod.completedBy) mod.completedBy = req.user._id;
        }
      }
    } else if (status === 'ongoing' || status === 'hold') {
      project.endedAt = null;
    }
  }

  await project.save();

  const populated = await Project.findById(project._id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:update', { projectId: String(project._id) });
  res.json({ project: await fullProjectDto(populated) });
}));

// DELETE /api/projects/:id — Admin & Project Manager delete project
router.delete('/projects/:id', requireRole('admin', 'manager'), ah(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // If manager, ensure they manage this project (admin can delete any project)
  if (req.user.role === 'manager' && project.manager && String(project.manager) !== String(req.user._id)) {
    return res.status(403).json({ error: 'You can only delete projects you manage' });
  }

  const teamId = project.team;
  if (teamId) {
    const team = await Team.findById(teamId);
    if (team) {
      // Free up all developer members
      if (team.members && team.members.length > 0) {
        await User.updateMany({ _id: { $in: team.members } }, { team: null });
      }
      // Free up team leader if this team was attached
      if (team.leader) {
        await User.findByIdAndUpdate(team.leader, { team: null });
      }
      // Delete associated team
      await Team.findByIdAndDelete(teamId);
    }
  }

  // Delete work logs for this project
  await WorkLog.deleteMany({ project: project._id });

  // Delete project
  await Project.findByIdAndDelete(project._id);

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:delete', { projectId: String(project._id) });
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'team:update', {});
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'user:update', {});

  res.json({ ok: true, message: 'Project and associated team deleted successfully' });
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
    .populate({ path: 'team', select: 'name project', populate: { path: 'project', select: 'name status' } });
  res.json({
    users: users.map((u) => {
      const teamObj = u.team && typeof u.team === 'object' ? u.team : null;
      const projObj = teamObj && teamObj.project && typeof teamObj.project === 'object' ? teamObj.project : null;
      return {
        id: String(u._id),
        name: u.name,
        role: u.role,
        initials: u.initials,
        teamName: teamObj ? teamObj.name : '',
        projectName: projObj ? projObj.name : (teamObj ? teamObj.name : ''),
        hasProject: !!teamObj && (!projObj || projObj.status !== 'completed')
      };
    })
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
    const dev = await User.findById(req.body.addMemberId);
    if (dev && dev.team && String(dev.team) !== String(team._id)) {
      return res.status(400).json({ error: `${dev.name} is already assigned to another project team. A developer can only work on one project.` });
    }
    if (!team.members.some((m) => String(m) === String(req.body.addMemberId))) {
      team.members.push(req.body.addMemberId);
      await User.findByIdAndUpdate(req.body.addMemberId, { team: team._id });
    }
  }
  if (req.body.removeMemberId) {
    team.members = team.members.filter((m) => String(m) !== String(req.body.removeMemberId));
    await User.findByIdAndUpdate(req.body.removeMemberId, { team: null });
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
  const hash = await bcrypt.hash(password || 'welcome', 10);
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
  const allowed = ['workStartHour', 'workEndHour', 'workEndMinute', 'workDays', 'intervalMinutes', 'minWords', 'graceMinutes', 'idleMinutes', 'batchThreshold', 'notifications', 'eodDeadline', 'holidays'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  }
  await settings.save();
  res.json({ settings });
}));

// POST /api/settings/holidays — Admin adds/updates a holiday date or working override
router.post('/settings/holidays', requireRole('admin'), ah(async (req, res) => {
  const { date, name, type, isWorkingOverride } = req.body || {};
  if (!date) return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });

  const settings = await Setting.get();
  settings.holidays = (settings.holidays || []).filter((h) => h.date !== date);
  settings.holidays.push({
    date,
    name: name || 'Holiday',
    type: type || 'org',
    isWorkingOverride: !!isWorkingOverride
  });
  await settings.save();
  res.json({ settings });
}));

// DELETE /api/settings/holidays/:date — Admin removes a holiday entry
router.delete('/settings/holidays/:date', requireRole('admin'), ah(async (req, res) => {
  const settings = await Setting.get();
  settings.holidays = (settings.holidays || []).filter((h) => h.date !== req.params.date);
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
