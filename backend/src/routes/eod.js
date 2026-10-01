const express = require('express');
const { EodReport, Setting } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { scopeFor } = require('../util/scope');
const { dayStr, fmtTime, fmtDateMDY } = require('../util/time');
const { emitToRoles, emitToUser } = require('../sockets');

const router = express.Router();
router.use(authRequired, attachUser);

function eodDto(e) {
  return {
    id: String(e._id),
    date: e.date,
    dateLabel: fmtDateMDY(new Date(`${e.date}T12:00:00`)),
    summary: e.summary,
    carryForward: e.carryForward,
    blockers: e.blockers,
    rating: e.rating,
    checklist: e.checklist || [],
    wordCount: e.wordCount,
    time: fmtTime(e.submittedAt),
    submittedAtISO: e.submittedAt
  };
}

// GET /api/eod?developerId=
router.get('/', ah(async (req, res) => {
  const today = dayStr();
  let developerFilter = req.user._id;
  if (req.user.role !== 'developer' && req.query.developerId) {
    const scope = await scopeFor(req.user);
    const id = String(req.query.developerId);
    if (scope.developerIds.some((d) => String(d) === id)) developerFilter = id;
  }

  const docs = await EodReport.find({ developer: developerFilter }).sort({ date: -1 }).limit(15);
  const todayReport = docs.find((e) => e.date === today) || null;
  const past = docs.filter((e) => e.date !== today);

  // today's logged work summary for the form header
  const { WorkLog } = require('../models');
  const logs = await WorkLog.find({ developer: developerFilter, date: today });
  res.json({
    today: todayReport ? eodDto(todayReport) : null,
    past: past.map(eodDto),
    todayStats: {
      logs: logs.length,
      done: logs.filter((l) => l.status === 'done').length,
      progress: logs.filter((l) => l.status === 'progress').length,
      blocked: logs.filter((l) => l.status === 'blocked').length,
      commits: logs.reduce((s, l) => s + (l.commitsCount || 0), 0),
      activeMinutes: logs.reduce((s, l) => s + (l.activeMinutes || 0), 0)
    }
  });
}));

// POST /api/eod
router.post('/', ah(async (req, res) => {
  const { summary, carryForward, blockers, rating, checklist } = req.body || {};
  const settings = await Setting.get();
  const words = String(summary || '').trim().split(/\s+/).filter(Boolean).length;
  const minWords = 50;
  if (words < minWords) {
    return res.status(400).json({ error: `Day summary must be at least ${minWords} words (currently ${words})` });
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const EOD_OPEN_MINUTES = 15 * 60 + 45; // 3:45 PM
  if (currentMinutes < EOD_OPEN_MINUTES) {
    return res.status(400).json({ error: 'EOD report submission is only allowed after 3:45 PM.' });
  }

  const date = dayStr();
  const existing = await EodReport.findOne({ developer: req.user._id, date });
  if (existing) {
    return res.status(409).json({ error: 'EOD report already submitted for today' });
  }

  const report = await EodReport.create({
    developer: req.user._id,
    team: req.user.team,
    date,
    summary: String(summary).trim(),
    carryForward: carryForward || '',
    blockers: blockers || '',
    rating: Number(rating) || 3,
    checklist: Array.isArray(checklist) ? checklist : [],
    wordCount: words,
    submittedAt: new Date()
  });
  void settings;

  const dto = eodDto(report);
  emitToUser(String(req.user._id), 'eod:new', dto);
  emitToRoles(['leader', 'manager', 'admin'], 'eod:new', { ...dto, developerId: String(req.user._id) });
  res.status(201).json({ report: dto });
}));

module.exports = router;
