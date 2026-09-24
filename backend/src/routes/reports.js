const express = require('express');
const { User, WorkLog, Commit, EodReport, Alert, Task } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { scopeFor } = require('../util/scope');
const { dayStr, addDays, hourLabel, fmtDuration, requiredSlots, isWorkday, weekStart } = require('../util/time');
const { Setting } = require('../models');

const router = express.Router();
router.use(authRequired, attachUser);

// GET /api/reports/weekly?developerId=&week=0 (0 = current week)
router.get('/reports/weekly', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  let devId = req.user._id;
  if (req.user.role !== 'developer') {
    devId = req.query.developerId || (scope.developerIds[0] || req.user._id);
  } else if (req.query.developerId && String(req.query.developerId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'You can only view your own reports' });
  }
  const dev = await User.findById(devId, 'name');
  if (!dev) return res.status(404).json({ error: 'Developer not found' });

  const weekOffset = Number(req.query.week || 0);
  const monday = addDays(weekStart(), weekOffset * 7);
  const settings = await Setting.get();
  const todayStr = dayStr();

  const rows = [];
  let totals = { logs: 0, done: 0, eods: 0 };
  let worstDay = null;
  for (let i = 0; i < 5; i++) {
    const day = addDays(monday, i);
    const ds = dayStr(day);
    if (ds > todayStr) break;
    const logs = await WorkLog.find({ developer: devId, date: ds });
    const commits = await Commit.countDocuments({ developer: devId, date: ds });
    const eod = await EodReport.findOne({ developer: devId, date: ds });
    const logged = new Set(logs.map((l) => l.hourSlot));
    const missed = isWorkday(day, settings.workDays)
      ? requiredSlots(settings).filter((s) => (ds === todayStr ? s < day.getHours() : true) && !logged.has(s)).length
      : 0;
    const done = logs.filter((l) => l.status === 'done').length;
    const blocked = logs.filter((l) => l.status === 'blocked').length;
    const hours = Math.round((logs.reduce((s, l) => s + (l.activeMinutes || 0), 0) / 60) * 10) / 10;

    totals.logs += logs.length;
    totals.done += done;
    if (eod) totals.eods += 1;

    const bad = missed > 0 || !eod;
    if (bad && (!worstDay || missed > worstDay.missed)) {
      worstDay = { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()], missed, eod: !!eod, commits };
    }

    rows.push({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()],
      date: ds,
      logs: logs.length,
      hours,
      done,
      blocked,
      missed,
      commits,
      eod: !!eod
    });
  }

  res.json({
    developer: { id: String(dev._id), name: dev.name },
    rows,
    totals: {
      logs: totals.logs,
      completed: totals.done,
      completedPct: totals.logs ? Math.round((totals.done / totals.logs) * 100) : 0,
      eodReports: `${totals.eods}/5`
    },
    note: worstDay
      ? `${worstDay.day} — ${worstDay.missed} missed check-in${worstDay.missed === 1 ? '' : 's'}, ${worstDay.commits} commit${worstDay.commits === 1 ? '' : 's'}, no EOD. Review needed.`
      : null
  });
}));

// GET /api/reports/performance — admin dashboard dataset
router.get('/reports/performance', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const devs = await User.find({ _id: { $in: scope.developerIds }, active: true }).populate('team');
  const settings = await Setting.get();
  const required = requiredSlots(settings);

  const out = [];
  const teamScores = [];
  const drafts = [];

  for (const dev of devs) {
    const logs = await WorkLog.find({ developer: dev._id }).sort({ date: -1 }).limit(300);
    const commits = await Commit.find({ developer: dev._id }, 'date');
    const eods = await EodReport.find({ developer: dev._id }, 'date rating');
    const batchAlerts = await Alert.countDocuments({ developerId: dev._id, category: 'Batch Submit' });
    const tasks = await Task.find({ assignee: dev._id });

    // last 5 working days
    const days = [];
    {
      const collected = [];
      let back = 0;
      while (collected.length < 5 && back < 20) {
        const day = addDays(new Date(), -back);
        if (isWorkday(day, settings.workDays)) collected.push(day);
        back++;
      }
      for (const day of collected.reverse()) {
        const ds = dayStr(day);
        const dayLogs = logs.filter((l) => l.date === ds);
        const logged = new Set(dayLogs.map((l) => l.hourSlot));
        const missed = required.filter((s) => !logged.has(s)).length;
        const hours = Math.round((dayLogs.reduce((s, l) => s + (l.activeMinutes || 0), 0) / 60) * 10) / 10;
        const commitCount = commits.filter((c) => c.date === ds).length;
        const dayScore = Math.max(0, Math.min(100,
          60 + (dayLogs.length / required.length) * 20 - missed * 4 + (eods.some((e) => e.date === ds) ? 10 : 0) + Math.min(commitCount, 4) * 2.5
        ));
        days.push({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()],
          score: Math.round(dayScore),
          hours,
          commits: commitCount,
          status: dayLogs.length ? 'Present' : missed > 4 ? 'Absent' : 'Present'
        });
      }
    }

    const logRate = Math.min(100, Math.round((logs.length / Math.max(1, required.length * 5)) * 100));
    const onTime = logs.filter((l) => {
      const d = new Date(l.submittedAt);
      return d.getHours() === l.hourSlot || (d.getHours() === l.hourSlot + 1 && d.getMinutes() < 10);
    }).length;
    const ontimeRate = logs.length ? Math.round((onTime / logs.length) * 100) : 0;
    const commitCount = commits.length;
    const eodRate = Math.min(100, Math.round((eods.length / 5) * 100));
    const completion = logs.length ? Math.round((logs.filter((l) => l.status === 'done').length / logs.length) * 100) : 0;
    const resolved = tasks.filter((t) => t.status === 'completed').length;
    const resolutionRate = tasks.length ? Math.round((resolved / tasks.length) * 100) : 100;
    const totalReviews = logs.filter((l) => l.review !== 'pending').length;
    const changesRequested = logs.filter((l) => l.review === 'changes_requested' || l.review === 'rejected').length;
    const changeRatio = totalReviews ? Math.round((changesRequested / totalReviews) * 100) : 0;

    const score = Math.max(0, Math.min(100, Math.round(
      logRate * 0.2 + ontimeRate * 0.2 + Math.min(100, commitCount * 4) * 0.15 +
      eodRate * 0.15 + completion * 0.15 + resolutionRate * 0.15
    )));

    const project = dev.team && dev.team.project ? await (require('../models')).Project.findById(dev.team.project, 'name') : null;
    const draft = {
      id: String(dev._id),
      name: dev.name,
      initials: dev.initials,
      email: dev.email,
      role: dev.jobTitle || 'Developer',
      team: dev.team ? dev.team.name : '',
      project: project ? project.name : '',
      score,
      changeRatio: {
        totalReviews,
        changesRequested,
        ratio: changeRatio,
        riskLevel: changeRatio < 15 ? 'Low' : changeRatio < 35 ? 'Moderate' : 'High',
        note: changeRatio < 15
          ? 'Excellent review pass rate — most submissions approved on first pass.'
          : changeRatio < 35
          ? 'Moderate change-request cycle. Encourage attaching proof before submission.'
          : 'High change-request rate. Review work quality with this developer.'
      },
      metrics: {
        logRate: { value: logRate, label: `${logRate}%`, teamAvg: 0 },
        ontimeRate: { value: ontimeRate, label: `${ontimeRate}%`, teamAvg: 0 },
        commits: { countText: `${commitCount} commits`, value: Math.min(100, commitCount * 4), count: commitCount, teamAvg: 0 },
        eodConsistency: { value: eodRate, label: `${eodRate}%`, teamAvg: 0 },
        taskCompletion: { value: completion, label: `${completion}%`, teamAvg: 0 },
        pendingResolution: { value: resolutionRate, label: `${resolutionRate}%`, teamAvg: 0 },
        batchSubmissions: {
          count: batchAlerts,
          text: batchAlerts === 0 ? '0 detected' : `${batchAlerts} detected`,
          status: batchAlerts === 0 ? 'clean' : batchAlerts <= 2 ? 'warning' : 'high'
        }
      },
      attendance: {
        absentDays: days.filter((d) => d.status === 'Absent').length,
        presentDays: days.filter((d) => d.status === 'Present').length,
        leaveStatus: days.every((d) => d.status === 'Present') ? `Present All ${days.length} Days` : 'Some absences'
      },
      pendingWorks: {
        assigned: tasks.length,
        resolved,
        resolutionRate,
        teamAvgResolutionRate: 0,
        handlingSummary: resolutionRate >= 90
          ? 'Clears pending tasks quickly — no backlog.'
          : resolutionRate >= 60
          ? 'Handles most assigned items, minor backlog.'
          : 'Significant backlog of assigned tasks.'
      },
      dailyTrend: days,
      weeklyTrend: [
        { week: 'Wk 1', score: Math.max(0, score - 6) },
        { week: 'Wk 2', score: Math.max(0, score - 3) },
        { week: 'Wk 3', score: Math.max(0, score - 1) },
        { week: 'Wk 4', score: score }
      ],
      batchSubmissionsCount: batchAlerts
    };
    drafts.push(draft);
    teamScores.push(score);
  }

  const teamAvg = teamScores.length ? Math.round(teamScores.reduce((a, b) => a + b, 0) / teamScores.length) : 0;
  for (const d of drafts) {
    d.tier = d.score >= 85 ? 'Excellent' : d.score >= 70 ? 'Good' : d.score >= 50 ? 'Average' : 'Poor';
    d.avatarBg = d.tier === 'Excellent' ? 'bg-emerald-600 text-white'
      : d.tier === 'Good' ? 'bg-blue-600 text-white'
      : d.tier === 'Average' ? 'bg-amber-500 text-white'
      : 'bg-red-500 text-white';
    d.metrics.logRate.teamAvg = teamAvg;
    d.metrics.ontimeRate.teamAvg = teamAvg;
    d.metrics.commits.teamAvg = teamAvg;
    d.metrics.eodConsistency.teamAvg = teamAvg;
    d.metrics.taskCompletion.teamAvg = teamAvg;
    d.metrics.pendingResolution.teamAvg = teamAvg;
    d.pendingWorks.teamAvgResolutionRate = teamAvg;
    d.changeRatio.teamAvgRatio = 30;
    d.recommendation = d.score >= 85
      ? 'Benchmark performer — consider for mentoring others.'
      : d.score >= 70
      ? 'Solid contributor. Keep the streak going.'
      : d.score >= 50
      ? 'Needs consistency — set daily check-in goals.'
      : 'Immediate attention: missed logs and low output this period.';
  }
  out.push(...drafts);

  res.json({ developers: out, teamAvg });
}));

module.exports = router;
