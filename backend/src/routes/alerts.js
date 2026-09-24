const express = require('express');
const { Alert, User } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { alertDto } = require('../util/dto');
const { emitToUser, emitToRoles } = require('../sockets');

const router = express.Router();
router.use(authRequired, attachUser);

// GET /api/alerts — role scoped
router.get('/', ah(async (req, res) => {
  let query;
  if (req.user.role === 'developer') {
    query = { audience: 'developer', user: req.user._id };
  } else if (req.user.role === 'leader') {
    const { scopeFor } = require('../util/scope');
    const scope = await scopeFor(req.user);
    query = {
      audience: 'leader',
      $or: [
        { user: req.user._id },
        { developerId: { $in: scope.developerIds } },
        { team: { $in: scope.teamIds } }
      ]
    };
  } else if (req.user.role === 'manager') {
    const { scopeFor } = require('../util/scope');
    const scope = await scopeFor(req.user);
    query = {
      audience: 'manager',
      $or: [
        { user: req.user._id },
        { managerScope: req.user._id },
        { developerId: { $in: scope.developerIds } }
      ]
    };
  } else {
    query = { audience: { $in: ['leader', 'manager'] } };
  }
  const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(50);
  res.json({ alerts: alerts.map(alertDto) });
}));

// POST /api/alerts/read-all
router.post('/read-all', ah(async (req, res) => {
  let query;
  if (req.user.role === 'developer') {
    query = { audience: 'developer', user: req.user._id };
  } else if (req.user.role === 'leader') {
    const { scopeFor } = require('../util/scope');
    const scope = await scopeFor(req.user);
    query = {
      audience: 'leader',
      $or: [
        { user: req.user._id },
        { developerId: { $in: scope.developerIds } },
        { team: { $in: scope.teamIds } }
      ]
    };
  } else if (req.user.role === 'manager') {
    const { scopeFor } = require('../util/scope');
    const scope = await scopeFor(req.user);
    query = {
      audience: 'manager',
      $or: [
        { user: req.user._id },
        { managerScope: req.user._id },
        { developerId: { $in: scope.developerIds } }
      ]
    };
  } else {
    query = { audience: { $in: ['leader', 'manager'] } };
  }
  await Alert.updateMany({ ...query, read: false }, { read: true });
  res.json({ ok: true });
}));

// POST /api/alerts/:id/action { action: 'Mark Seen' | 'Send Reminder' | ... }
router.post('/:id/action', ah(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  const action = req.body?.action || 'Mark Seen';
  if (action === 'Send Reminder') {
    if (alert.developerId) {
      await Alert.create({
        audience: 'developer', user: alert.developerId, kind: 'reminder', unread: true,
        title: `Reminder from ${req.user.name}`,
        body: alert.body || 'Please submit your pending work log.'
      });
      emitToUser(String(alert.developerId), 'alert:new', { kind: 'reminder' });
    }
    alert.read = true;
    await alert.save();
  } else if (action === 'Mark Seen') {
    alert.read = true;
    await alert.save();
  } else if (action === 'Reject All') {
    alert.read = true;
    await alert.save();
    if (alert.developerId) {
      await Alert.create({
        audience: 'developer', user: alert.developerId, kind: 'rejection', unread: true,
        title: 'Batch Submission Flagged',
        body: 'Your rapid batch of logs was flagged. Please submit logs hourly with real proof.'
      });
      emitToUser(String(alert.developerId), 'alert:new', { kind: 'rejection' });
    }
  } else {
    // View / Review actions just mark it seen; navigation happens client-side
    alert.read = true;
    await alert.save();
  }

  emitToRoles(['leader', 'manager', 'admin'], 'alert:update', { id: String(alert._id) });
  res.json({ ok: true });
}));

module.exports = router;
