const express = require('express');
const { User, WorkLog, Commit, EodReport, Team, Project, Alert, Task } = require('../models');
const { authRequired, attachUser, requireRole, ah } = require('../middleware/auth');
const { scopeFor } = require('../util/scope');
const { dayStats, developerNote } = require('../util/dto');
const { dayStr, fmtTime, hourLabel, fmtDuration, requiredSlots, slotForNow, addDays, isWorkday, getHolidayInfo } = require('../util/time');
const { Setting } = require('../models');

const router = express.Router();
router.use(authRequired, attachUser);

// GET /api/developers — role-scoped list with today's live stats
router.get('/', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const settings = await Setting.get();
  const today = dayStr();
  const isWork = isWorkday(new Date(), settings);
  const holidayInfo = getHolidayInfo(new Date(), settings);
  const devs = await User.find({ _id: { $in: scope.developerIds }, active: true }).populate('team');

  const { perDev, currentSlot } = await dayStats(devs.map((d) => d._id));

  // yesterday EOD presence for the note
  const yesterday = dayStr(addDays(new Date(), -1));
  const yEods = await EodReport.find({ developer: { $in: devs.map((d) => d._id) }, date: yesterday }, 'developer');

  const changesRequested = await WorkLog.countDocuments({
    developer: { $in: devs.map((d) => d._id) },
    review: 'changes_requested'
  });

  const list = devs.map((dev) => {
    const s = perDev[String(dev._id)];
    const done = s.logs.filter((l) => l.status === 'done').length;
    const isTop = false; // computed below
    return {
      raw: dev,
      stat: {
        id: String(dev._id),
        name: dev.name,
        initials: dev.initials,
        email: dev.email,
        activeMinutes: s.activeMinutes,
        logs: s.logs.length,
        done,
        missed: s.missed,
        commits: s.commits,
        lastSeen: dev.lastSeenAt && dayStr(dev.lastSeenAt) === today ? fmtTime(dev.lastSeenAt) : 'Not seen today',
        online: !!(dev.lastSeenAt && Date.now() - dev.lastSeenAt.getTime() < 2 * 60 * 1000),
        team: dev.team ? dev.team.name : '',
        project: '',
        topPerformer: isTop,
        note: '',
        eodMissingYesterday: !yEods.some((e) => String(e.developer) === String(dev._id))
      }
    };
  });

  // top performer: most done tasks + active minutes
  let top = null;
  for (const item of list) {
    const score = item.stat.done * 10 + item.stat.activeMinutes / 10 + item.stat.commits * 5;
    if (!top || score > top.score) top = { id: item.stat.id, score };
  }

  // project name per dev (prefer the ongoing project for that team)
  const teamIds = scope.teamIds;
  const projects = await Project.find({ team: { $in: teamIds } }, 'name team status');
  const projectByTeam = {};
  for (const p of projects) {
    const key = String(p.team);
    if (!projectByTeam[key] || p.status === 'ongoing') projectByTeam[key] = p.name;
  }

  const result = list.map(({ raw: dev, stat }) => {
    const eodMissingYesterday = stat.eodMissingYesterday;
    delete stat.eodMissingYesterday;
    stat.project = projectByTeam[dev.team ? String(dev.team._id || dev.team) : ''] || '';
    stat.topPerformer = top && top.id === stat.id && stat.done > 0;
    stat.note = developerNote({
      missed: stat.missed,
      logsCount: stat.logs,
      eodMissingYesterday,
      topPerformer: stat.topPerformer,
      changesRequested: String(dev._id) && changesRequested > 0 && stat.logs > 0 ? 0 : 0,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.name
    });
    if (!isWork && stat.logs === 0) {
      stat.note = holidayInfo.name || 'Organization Holiday';
    } else if (stat.logs === 0 && stat.missed > 0) {
      stat.note = 'No activity';
    }
    delete stat.eodMissingYesterday;
    return stat;
  });

  res.json({ developers: result, currentSlot, date: today, isWorkday: isWork, isHoliday: holidayInfo.isHoliday, holiday: holidayInfo });
}));

// GET /api/developers/:id — detail panel data (logs, commits, eod)
router.get('/:id', requireRole('leader', 'manager', 'admin'), ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const id = req.params.id;
  if (!scope.developerIds.some((d) => String(d) === id)) {
    return res.status(403).json({ error: 'This developer is not in your scope' });
  }
  const dev = await User.findById(id).populate('team');
  if (!dev) return res.status(404).json({ error: 'Developer not found' });

  const today = dayStr();
  const logs = await WorkLog.find({ developer: id, date: today }).sort({ hourSlot: 1 }).populate('project', 'name');
  const project = dev.team && dev.team.project ? await Project.findById(dev.team.project, 'name') : null;

  const commitsToday = await Commit.find({ developer: id, date: today }).sort({ committedAt: -1 });
  const commitsYesterday = await Commit.find({
    developer: id,
    date: dayStr(addDays(new Date(), -1))
  }).sort({ committedAt: -1 });

  const eods = await EodReport.find({ developer: id }).sort({ date: -1 }).limit(1);
  const eod = eods[0] || null;

  const { perDev } = await dayStats([id]);
  const s = perDev[id];

  res.json({
    developer: {
      id: String(dev._id),
      name: dev.name,
      initials: dev.initials,
      email: dev.email,
      activeMinutes: s.activeMinutes,
      logs: s.logs.length,
      done: s.logs.filter((l) => l.status === 'done').length,
      missed: s.missed,
      commits: s.commits,
      lastSeen: dev.lastSeenAt && dayStr(dev.lastSeenAt) === today ? fmtTime(dev.lastSeenAt) : 'Not seen today',
      online: !!(dev.lastSeenAt && Date.now() - dev.lastSeenAt.getTime() < 2 * 60 * 1000),
      team: dev.team ? dev.team.name : '',
      project: project ? project.name : ''
    },
    logs: logs.map((l) => ({
      id: String(l._id),
      hourLabel: hourLabel(l.hourSlot),
      hourSlot: l.hourSlot,
      task: l.task,
      status: l.status,
      description: l.description,
      submittedAt: fmtTime(l.submittedAt),
      activeMinutes: l.activeMinutes,
      attachment: l.attachmentName,
      commits: l.commitsCount,
      review: l.review,
      reviewNote: l.reviewNote,
      targetedFeedback: l.targetedFeedback || [],
      blocker: l.blocker,
      wordCount: l.wordCount,
      project: l.project ? l.project.name : ''
    })),
    commits: commitsToday.map((c) => ({
      id: String(c._id), message: c.message, branch: c.branch, time: fmtTime(c.committedAt), files: c.files, sha: c.sha
    })),
    commitsYesterdayCount: commitsYesterday.length,
    eod: eod
      ? {
          dateLabel: eod.date,
          rating: eod.rating,
          summary: eod.summary,
          time: fmtTime(eod.submittedAt)
        }
      : null,
    activeTimeLabel: fmtDuration(s.activeMinutes)
  });
}));

module.exports = router;
