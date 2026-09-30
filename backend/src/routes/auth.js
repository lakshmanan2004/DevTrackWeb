const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Team, Project, WorkLog, Alert, Task } = require('../models');
const { sign, authRequired, attachUser, ah } = require('../middleware/auth');
const { dayStr, slotForNow, fmtDateLong } = require('../util/time');
const { Setting } = require('../models');

const router = express.Router();

// POST /api/auth/login
router.post('/login', ah(async (req, res) => {
  const { email, password, remember } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).populate('team');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (!user.active) return res.status(403).json({ error: 'This account has been deactivated' });
  const token = sign(user);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  if (remember) {
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
  }
  res.cookie('devtrack_token', token, cookieOptions);
  res.json({ token, user: await mePayload(user) });
}));


// POST /api/auth/logout
router.post('/logout', ah(async (_req, res) => {
  res.clearCookie('devtrack_token');
  res.json({ ok: true, message: 'Logged out successfully' });
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
    lunchSlot: user.lunchSlot || 12,
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
    const teams = await Team.find({
      $or: [
        { leader: user._id },
        { leader: String(user._id) },
        ...(user.team ? [{ _id: user.team }] : [])
      ]
    }).populate('project', 'name');
    const projs = teams.map((t) => (t.project ? t.project.name : null)).filter(Boolean);
    const uniqueProjs = Array.from(new Set(projs));
    const teamNames = Array.from(new Set(teams.map((t) => t.name).filter(Boolean)));
    out.teamName = teamNames.join(', ');
    out.projectName = uniqueProjs.join(', ');
    out.projectNames = uniqueProjs;
    out.teams = teams.map((t) => ({ id: String(t._id), name: t.name, projectName: t.project?.name || '' }));
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
    // Cleanup any orphaned targeted feedback tasks whose linked log has been approved
    const orphanedTasks = await Task.find({
      assignee: user._id,
      status: { $ne: 'completed' },
      linkedLog: { $ne: null }
    }).populate('linkedLog', 'review');
    for (const ot of orphanedTasks) {
      if (ot.linkedLog && ot.linkedLog.review === 'approved') {
        ot.status = 'completed';
        await ot.save();
      }
    }

    badges.alerts = await Alert.countDocuments({ audience: 'developer', user: user._id, read: false });

    // Work logs requiring developer action or currently in progress / blocked
    const inProgressLogs = await WorkLog.find({
      developer: user._id,
      $or: [
        { review: { $in: ['changes_requested', 'rejected'] } },
        { status: { $in: ['progress', 'blocked'] } }
      ]
    });
    const pendingLogsCount = inProgressLogs.filter(l => !(l.status === 'done' && l.review === 'approved')).length;

    badges.approvals = await WorkLog.countDocuments({
      developer: user._id,
      review: { $in: ['changes_requested', 'rejected'] }
    });

    const tasks = await Task.find({
      assignee: user._id,
      status: { $ne: 'completed' },
      type: { $ne: 'targeted_feedback' }
    }).populate('linkedLog', 'review status');

    let pendingTasksCount = 0;
    for (const t of tasks) {
      if (!t.linkedLog || !(t.linkedLog.review === 'approved' && t.linkedLog.status === 'done')) {
        pendingTasksCount++;
      }
    }

    badges.pendingWorks = pendingLogsCount + pendingTasksCount;
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
