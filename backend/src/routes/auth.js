const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Team, Project, WorkLog, Alert, Task } = require('../models');
const { sign, authRequired, attachUser, ah } = require('../middleware/auth');
const { dayStr, slotForNow, fmtDateLong } = require('../util/time');
const { Setting } = require('../models');

const router = express.Router();

// POST /api/auth/login
router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).populate('team');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (!user.active) return res.status(403).json({ error: 'This account has been deactivated' });
  res.json({ token: sign(user), user: await mePayload(user) });
}));

async function mePayload(user) {
  const out = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
    github: user.github,
    jobTitle: user.jobTitle,
    teamName: '',
    projectName: '',
    leaderName: '',
    joined: user.joinedAt
  };
  if (user.role === 'developer' && user.team) {
    const team = await Team.findById(user.team).populate('leader', 'name').populate('project', 'name');
    if (team) {
      out.teamName = team.name;
      out.leaderName = team.leader ? team.leader.name : '';
      if (team.project) out.projectName = team.project.name;
    }
  } else if (user.role === 'leader') {
    const team = await Team.findOne({ leader: user._id }).populate('project', 'name');
    if (team) {
      out.teamName = team.name;
      if (team.project) out.projectName = team.project.name;
    }
  } else if (user.role === 'manager') {
    const projects = await Project.find({ manager: user._id });
    out.projectName = `${projects.length} project${projects.length === 1 ? '' : 's'}`;
  }
  return out;
}

async function badgeCounts(user) {
  const today = dayStr();
  const badges = { alerts: 0, approvals: 0, pendingWorks: 0 };
  if (user.role === 'developer') {
    badges.alerts = await Alert.countDocuments({ audience: 'developer', user: user._id, read: false });
    badges.pendingWorks = await Task.countDocuments({ assignee: user._id, status: { $ne: 'completed' } });
    badges.approvals = await WorkLog.countDocuments({
      developer: user._id,
      review: { $in: ['changes_requested', 'rejected'] }
    });
  } else if (user.role === 'leader') {
    const { scopeFor } = require('../util/scope');
    const scope = await scopeFor(user);
    badges.alerts = await Alert.countDocuments({
      audience: 'leader', developerId: { $in: scope.developerIds.map(String) }, read: false
    });
    badges.approvals = await WorkLog.countDocuments({
      team: { $in: scope.teamIds }, date: today, review: 'pending'
    });
  } else if (user.role === 'manager') {
    badges.alerts = await Alert.countDocuments({ audience: 'manager', managerScope: user._id, read: false });
  }
  return badges;
}

// GET /api/auth/me  -> { user, badges, serverDate }
router.get('/me', authRequired, attachUser, ah(async (req, res) => {
  const settings = await Setting.get();
  res.json({
    user: await mePayload(req.user),
    badges: await badgeCounts(req.user),
    serverDate: fmtDateLong(new Date()),
    currentSlot: slotForNow(settings),
    settings: {
      workStartHour: settings.workStartHour,
      workEndHour: settings.workEndHour,
      minWords: settings.minWords,
      eodDeadline: settings.eodDeadline
    }
  });
}));

// GET /api/auth/stats/public -> live numbers for the login screen
router.get('/stats/public', ah(async (_req, res) => {
  const today = dayStr();
  const developers = await User.countDocuments({ role: 'developer', active: true });
  const logsToday = await WorkLog.countDocuments({ date: today });
  let onTimeRate = 98;
  const logs = await WorkLog.find({ date: today }, 'hourSlot submittedAt');
  if (logs.length) {
    const onTime = logs.filter((l) => {
      const d = new Date(l.submittedAt);
      const slotEnd = new Date(d);
      slotEnd.setHours(l.hourSlot + 1, 0, 0, 0);
      return d <= slotEnd;
    }).length;
    onTimeRate = Math.round((onTime / logs.length) * 100);
  }
  res.json({ developers, logsToday, onTimeRate });
}));

module.exports = router;
