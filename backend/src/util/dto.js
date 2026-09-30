const { dayStr, fmtTime, fmtDuration, hourLabel, fmtDateMDY, fmtDateLong, slotForNow, requiredSlots, isWorkday } = require('./time');
const { Setting } = require('../models');

// ---- shared builders ----------------------------------------------------

function workLogDto(log, extra = {}) {
  const isLate = !!(log.isLate || (log.submittedAt && (new Date(log.submittedAt).getHours() >= 17 || new Date(log.submittedAt) > new Date(new Date(log.submittedAt).setHours(log.hourSlot + 1, 0, 0, 0)))));
  return {
    id: String(log._id),
    isLate,
    submissionStatus: isLate ? 'Late Submit' : 'On Time',
    developerId: log.developer ? String(log.developer) : extra.developerId || '',
    developerName: extra.developerName || '',
    initials: extra.initials || '',
    date: log.date,
    hourSlot: log.hourSlot,
    hourLabel: hourLabel(log.hourSlot),
    task: log.task,
    status: log.status,
    description: log.description,
    submittedAt: fmtTime(log.submittedAt),
    submittedAtISO: log.submittedAt,
    activeMinutes: log.activeMinutes,
    attachment: log.attachmentName || 'screenshot.png',
    attachmentUrl: log.attachmentUrl || '',
    commits: log.commitsCount,
    commitUrl: log.commitUrl || '',
    review: log.review,
    reviewNote: log.reviewNote || '',
    targetedFeedback: (log.targetedFeedback || []).map((fb) => ({
      id: fb.id,
      highlightedText: fb.highlightedText,
      comment: fb.comment,
      screenshotUrl: fb.screenshotUrl || undefined,
      screenshotName: fb.screenshotName || undefined,
      createdAt: fmtTime(fb.createdAt)
    })),
    blocker: log.blocker || '',
    wordCount: log.wordCount,
    project: extra.projectName || '',
    linkedTask: log.linkedTask ? String(log.linkedTask) : undefined,
    isAssignedTask: !!(log.linkedTask || log.isAssignedTask),
    assignedTaskTitle: log.assignedTaskTitle || extra.assignedTaskTitle || '',
    resubmissions: (log.resubmissions || []).map((r) => ({ text: r.text, at: fmtTime(r.at) }))
  };
}

function commitDto(c, extra = {}) {
  return {
    id: String(c._id),
    message: c.message,
    branch: c.branch,
    time: fmtTime(c.committedAt),
    files: c.files,
    sha: c.sha,
    url: c.url || '',
    dev: extra.devName || '',
    initials: extra.initials || ''
  };
}

function alertDto(a) {
  return {
    id: String(a._id),
    kind: a.kind || 'reminder',
    severity: a.severity,
    category: a.category,
    who: a.who,
    developerId: a.developerId ? String(a.developerId) : '',
    title: a.title,
    body: a.body,
    meta: a.meta,
    detection: a.detection,
    idleTime: a.idleTime,
    lastActive: a.lastActive,
    unread: !a.read,
    actions: a.actions || [],
    timeline: a.timeline || [],
    time: fmtTime(a.createdAt) + ' · ' + fmtDateMDY(a.createdAt),
    createdAtISO: a.createdAt
  };
}

function taskDto(t) {
  return {
    id: String(t._id),
    title: t.title,
    note: t.note,
    priority: t.priority,
    dueDate: t.dueDate,
    assignedBy: t.assignedByName || 'Team Lead',
    assignerRole: t.assignedByRole,
    assignerName: `${t.assignedByName || ''} (${t.assignedByRole === 'TL' ? 'Team Lead' : 'Project Manager'})`,
    status: t.status,
    type: t.type,
    highlightedText: t.highlightedText || undefined,
    createdAtISO: t.createdAt
  };
}

// ---- developer day stats ------------------------------------------------

async function dayStats(developerIds, date = dayStr()) {
  const { WorkLog, Commit, EodReport, Project } = require('../models');
  const settings = await Setting.get();
  const currentSlot = slotForNow(settings);
  const required = requiredSlots(settings);
  const ids = developerIds.map((id) => id.toString());

  const logs = await WorkLog.find({ developer: { $in: ids }, date })
    .populate('developer', 'name initials')
    .populate('project', 'name');
  const commits = await Commit.find({ developer: { $in: ids }, date });
  const eods = await EodReport.find({ developer: { $in: ids }, date });

  const perDev = {};
  for (const id of ids) perDev[id] = { logs: [], commits: 0, eod: null, activeMinutes: 0 };
  for (const log of logs) {
    const key = String(log.developer._id || log.developer);
    if (!perDev[key]) continue;
    perDev[key].logs.push(log);
    perDev[key].activeMinutes += log.activeMinutes || 0;
  }
  for (const c of commits) {
    const key = String(c.developer);
    if (perDev[key]) perDev[key].commits += 1;
  }
  for (const e of eods) perDev[String(e.developer)].eod = e;

  const result = {};
  for (const id of ids) {
    const info = perDev[id];
    const loggedSlots = new Set(info.logs.map((l) => l.hourSlot));
    const elapsed = required.filter((s) => s < currentSlot);
    const missed = elapsed.filter((s) => !loggedSlots.has(s)).length;
    const hoursCovered = info.logs.length;
    const slotsSoFar = elapsed.length || 0;
    result[id] = {
      logs: info.logs,
      commits: info.commits,
      eod: info.eod,
      activeMinutes: info.activeMinutes,
      missed,
      hoursCovered,
      slotsSoFar,
      currentSlot,
      firstSeen: info.logs.length
        ? fmtTime(new Date(Math.min(...info.logs.map((l) => new Date(l.submittedAt).getTime()))))
        : null
    };
  }
  return { perDev: result, settings, currentSlot };
}

function developerNote({ missed, logsCount, eodMissing, topPerformer, changesRequested }) {
  if (topPerformer) return 'Top performer';
  if (logsCount === 0 && missed > 0) return 'No activity';
  if (changesRequested > 0) return 'Changes requested';
  if (eodMissing) return 'EOD missing yesterday';
  if (missed > 0) return 'Missed check-in';
  if (logsCount > 0) return 'All logs on time';
  return 'No activity yet';
}

function projectDto(project, team, stats = {}) {
  return {
    id: String(project._id),
    name: project.name,
    description: project.description,
    status: project.status,
    manager: project.manager ? project.manager.name : '',
    managerId: project.manager ? String(project.manager._id || project.manager) : '',
    leader: team && team.leader ? team.leader.name : '',
    leaderId: team && team.leader ? String(team.leader._id || team.leader) : '',
    team: team ? team.name : '',
    teamId: team ? String(project.team) : '',
    developers: team ? team.members.length : 0,
    developerNames: team && team.members ? team.members.map((m) => m.name) : [],
    started: fmtDateMDY(project.startedAt),
    targetDate: project.targetDate ? fmtDateMDY(project.targetDate) : '',
    ended: project.endedAt ? fmtDateMDY(project.endedAt) : '',
    repoUrl: project.repoUrl || '',
    modules: (project.modules || []).map((m) => ({
      id: String(m._id || m.id),
      name: m.name,
      description: m.description || '',
      weightPercentage: m.weightPercentage || 0,
      status: m.status || 'todo',
      completedAt: m.completedAt ? fmtDateMDY(m.completedAt) : undefined,
      completedBy: m.completedBy ? String(m.completedBy) : undefined,
      logsCount: m.logsCount || 0,
      totalMinutes: m.totalMinutes || 0,
      submittedLogs: m.submittedLogs || []
    })),
    // live-computed stats (fallback to 0)
    progress: stats.progress ?? 0,
    health: stats.health ?? 'On Track',
    tasksDone: stats.tasksDone ?? 0,
    blockers: stats.blockers ?? 0,
    activeDevs: stats.activeDevs ?? 0,
    inProgress: stats.inProgress ?? 0
  };
}

module.exports = {
  workLogDto,
  commitDto,
  alertDto,
  taskDto,
  dayStats,
  developerNote,
  projectDto
};
