const express = require('express');
const { Leave, User, Team, Project, Alert, Setting } = require('../models');
const { authRequired, attachUser, ah, requireRole } = require('../middleware/auth');
const { scopeFor } = require('../util/scope');
const { requiredSlots, dayStr, hourLabel } = require('../util/time');
const { emitToRoles, emitToUser } = require('../sockets');

const router = express.Router();
router.use(authRequired, attachUser);

// GET /api/leaves - List leaves based on role
router.get('/', ah(async (req, res) => {
  let query = {};
  if (req.user.role === 'developer') {
    query = { developer: req.user._id };
  } else if (req.user.role === 'leader') {
    const scope = await scopeFor(req.user);
    query = { developer: { $in: scope.developerIds } };
  } else if (req.user.role === 'manager') {
    const scope = await scopeFor(req.user);
    query = { developer: { $in: scope.developerIds } };
  }
  // admin gets all

  if (req.query.date) {
    query.date = req.query.date;
  }
  if (req.query.month) {
    const [y, m] = req.query.month.split('-');
    const daysInMonth = new Date(Number(y), Number(m), 0).getDate();
    query.date = {
      $gte: `${y}-${m.padStart(2, '0')}-01`,
      $lte: `${y}-${m.padStart(2, '0')}-${daysInMonth}`
    };
  }

  const leaves = await Leave.find(query)
    .populate('developer', 'name email role initials lunchSlot')
    .populate('team', 'name')
    .populate('project', 'name')
    .sort({ date: -1, appliedAt: -1 });

  res.json({ leaves });
}));

// POST /api/leaves - Developer marks half-day or full-day leave
router.post('/', requireRole('developer', 'leader', 'admin'), ah(async (req, res) => {
  const { date, type, reason, developerId } = req.body;
  if (!date || !type || !reason?.trim()) {
    return res.status(400).json({ error: 'Date, leave type, and reason are required' });
  }

  const targetDevId = (req.user.role === 'admin' || req.user.role === 'leader') && developerId
    ? developerId
    : req.user._id;

  const dev = await User.findById(targetDevId).populate('team');
  if (!dev) return res.status(404).json({ error: 'Developer not found' });

  const settings = await Setting.get();
  const devLunch = dev.lunchSlot || 12;
  const allReqSlots = requiredSlots(settings, devLunch);

  // Compute excused slots
  let slots = [];
  if (type === 'half_day_morning') {
    // 8 AM to 12/1 PM (morning half)
    slots = allReqSlots.filter((s) => s < 13);
  } else if (type === 'half_day_afternoon') {
    // 1 PM/2 PM to 5 PM (afternoon half)
    slots = allReqSlots.filter((s) => s >= 13);
  } else {
    // full_day
    slots = allReqSlots;
  }

  const team = dev.team;
  const project = team && team.project ? await Project.findById(team.project) : null;

  // Upsert leave for that developer and date
  const leave = await Leave.findOneAndUpdate(
    { developer: dev._id, date },
    {
      developer: dev._id,
      team: team ? team._id : undefined,
      project: project ? project._id : undefined,
      date,
      type,
      slots,
      reason: reason.trim(),
      status: 'approved',
      appliedAt: new Date()
    },
    { upsert: true, new: true }
  );

  const typeLabel =
    type === 'half_day_morning'
      ? 'Half-Day (Morning 9 AM – 1 PM)'
      : type === 'half_day_afternoon'
      ? 'Half-Day (Afternoon 2 PM – 6 PM)'
      : 'Full-Day Leave';

  // Notify Team Leader & Project Manager
  if (team) {
    if (team.leader) {
      await Alert.create({
        audience: 'leader',
        team: team._id,
        project: project ? project._id : undefined,
        developerId: dev._id,
        category: 'Leave / Half-Day',
        severity: 'flag',
        who: dev.name,
        title: `${dev.name} — Marked ${typeLabel}`,
        body: `Date: ${date} · Reason: "${reason.trim()}". Check-ins for ${slots.map(hourLabel).join(', ')} are excused.`,
        meta: `${date} · ${dev.name} · ${team.name}`,
        detection: `Developer self-service leave submission on ${new Date().toLocaleDateString()}. Alerts suppressed.`,
        actions: [`View ${dev.name.split(' ')[0]}`, 'Mark Seen']
      });
      emitToUser(String(team.leader), 'alert:new', { kind: 'leave' });
    }

    if (project && project.manager) {
      await Alert.create({
        audience: 'manager',
        managerScope: [project.manager],
        team: team._id,
        project: project._id,
        developerId: dev._id,
        category: 'Leave / Half-Day',
        severity: 'flag',
        who: dev.name,
        title: `${dev.name} — Marked ${typeLabel}`,
        body: `Date: ${date} · Reason: "${reason.trim()}". Check-in requirement excused.`,
        meta: `${date} · ${dev.name} · ${project.name}`,
        detection: `Leave notice registered in system.`,
        actions: ['Mark Seen']
      });
      emitToUser(String(project.manager), 'alert:new', { kind: 'leave' });
    }
  }

  emitToRoles(['leader', 'manager', 'admin', 'developer'], 'leave:update', { developerId: dev._id, date });

  res.json({ leave, success: true });
}));

// DELETE /api/leaves/:id - Cancel a leave
router.delete('/:id', ah(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave record not found' });

  if (req.user.role === 'developer' && String(leave.developer) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to cancel this leave' });
  }

  await Leave.findByIdAndDelete(req.params.id);
  emitToRoles(['leader', 'manager', 'admin', 'developer'], 'leave:update', { developerId: leave.developer, date: leave.date });

  res.json({ success: true });
}));

module.exports = router;
