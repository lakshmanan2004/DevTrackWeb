const express = require('express');
const { Alert, User } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { alertDto } = require('../util/dto');
const { emitToUser, emitToRoles } = require('../sockets');

async function alertQueryFor(user) {
  if (!user) return { _id: null };
  if (user.role === 'developer') {
    return { audience: 'developer', user: user._id };
  } else if (user.role === 'leader') {
    const { scopeFor } = require('../util/scope');
    const scope = await scopeFor(user);
    return {
      audience: 'leader',
      $or: [
        { user: user._id },
        { developerId: { $in: scope.developerIds } },
        { team: { $in: scope.teamIds } }
      ]
    };
  } else if (user.role === 'manager') {
    const { scopeFor } = require('../util/scope');
    const scope = await scopeFor(user);
    return {
      audience: 'manager',
      $or: [
        { user: user._id },
        { managerScope: user._id },
        { developerId: { $in: scope.developerIds } }
      ]
    };
  } else {
    // Admin / global
    return { audience: { $in: ['leader', 'manager'] } };
  }
}

const router = express.Router();
router.use(authRequired, attachUser);

// GET /api/alerts — role scoped
router.get('/', ah(async (req, res) => {
  const query = await alertQueryFor(req.user);
  const alerts = await Alert.find(query).sort({ createdAt: -1 });
  const unreadCount = alerts.filter((a) => !a.read).length;
  res.json({
    alerts: alerts.map(alertDto),
    unreadCount,
    totalCount: alerts.length
  });
}));

// POST /api/alerts/read-all
router.post('/read-all', ah(async (req, res) => {
  const query = await alertQueryFor(req.user);
  await Alert.updateMany({ ...query, read: false }, { read: true });
  emitToRoles(['leader', 'manager', 'developer', 'admin'], 'alert:update', {});
  res.json({ ok: true });
}));

// DELETE /api/alerts/clear-all — clear all alerts for current user's role scope
router.delete('/clear-all', ah(async (req, res) => {
  const query = await alertQueryFor(req.user);
  await Alert.deleteMany(query);
  emitToRoles(['leader', 'manager', 'developer', 'admin'], 'alert:update', {});
  res.json({ ok: true });
}));

// DELETE /api/alerts/:id — delete a single alert
router.delete('/:id', ah(async (req, res) => {
  const alert = await Alert.findByIdAndDelete(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  emitToRoles(['leader', 'manager', 'developer', 'admin'], 'alert:update', { id: req.params.id });
  res.json({ ok: true });
}));

// POST /api/alerts/:id/action { action: 'Mark Seen' | 'Send Reminder' | ... }
router.post('/:id/action', ah(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  const action = req.body?.action || 'Mark Seen';
  if (action === 'Send Reminder') {
    let devId = alert.developerId;
    if (!devId && alert.who) {
      const dev = await User.findOne({
        role: 'developer',
        name: new RegExp('^' + alert.who.replace(/[-\s].*/, '').trim(), 'i')
      });
      if (dev) devId = dev._id;
    }
    if (devId) {
      await Alert.create({
        audience: 'developer', user: devId, kind: 'reminder', unread: true,
        title: `Reminder from ${req.user.name}`,
        body: alert.body || 'Please submit your pending work log.'
      });
      emitToUser(String(devId), 'alert:new', { kind: 'reminder' });
    }
    alert.read = true;
    await alert.save();
  } else if (action === 'Mark Seen') {
    alert.read = true;
    await alert.save();
  } else if (action === 'Reject All') {
    alert.read = true;
    await alert.save();
    let devId = alert.developerId;
    if (!devId && alert.who) {
      const dev = await User.findOne({
        role: 'developer',
        name: new RegExp('^' + alert.who.replace(/[-\s].*/, '').trim(), 'i')
      });
      if (dev) devId = dev._id;
    }
    if (devId) {
      await Alert.create({
        audience: 'developer', user: devId, kind: 'rejection', unread: true,
        title: 'Batch Submission Flagged',
        body: 'Your rapid batch of logs was flagged. Please submit logs hourly with real proof.'
      });
      emitToUser(String(devId), 'alert:new', { kind: 'rejection' });
    }
  } else {
    // View / Review actions just mark it seen; navigation happens client-side
    alert.read = true;
    await alert.save();
  }

  emitToRoles(['leader', 'manager', 'developer', 'admin'], 'alert:update', { id: String(alert._id) });
  res.json({ ok: true });
}));

module.exports = router;
module.exports.alertQueryFor = alertQueryFor;

