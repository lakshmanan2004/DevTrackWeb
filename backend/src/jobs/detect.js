// Automated detection jobs (node-cron). All alerts are deduped via Alert.dedupeKey.
const cron = require('node-cron');
const { WorkLog, EodReport, Alert, User, Team, Project, Setting } = require('../models');
const { dayStr, hourLabel, fmtTime, fmtDateMDY, slotForNow, requiredSlots, isWorkday } = require('../util/time');
const { emitToRoles, emitToUser } = require('../sockets');

async function activeDevelopers() {
  return User.find({ role: 'developer', active: true }).populate('team');
}

async function createLeaderAlert(payload) {
  const exists = payload.dedupeKey ? await Alert.findOne({ dedupeKey: payload.dedupeKey }) : null;
  if (exists) return null;
  const alert = await Alert.create({ ...payload, audience: 'leader', read: false });
  emitToRoles(['leader'], 'alert:new', { category: alert.category, who: alert.who });
  return alert;
}

async function createDevAlert(user, payload) {
  const alert = await Alert.create({ ...payload, audience: 'developer', user: user._id, read: false });
  emitToUser(String(user._id), 'alert:new', { kind: alert.kind });
  return alert;
}

async function createManagerAlert(dev, payload) {
  const exists = payload.dedupeKey ? await Alert.findOne({ dedupeKey: payload.dedupeKey }) : null;
  if (exists) return null;
  const managers = await User.find({ role: 'manager', active: true });
  void managers;
  const project = dev.team && dev.team.project ? await Project.findById(dev.team.project) : null;
  const managerScope = project ? [String(project.manager)] : [];
  if (!managerScope.length) return null;
  const alert = await Alert.create({
    ...payload,
    audience: 'manager',
    managerScope,
    team: dev.team ? dev.team._id : undefined,
    project: project ? project._id : undefined,
    read: false
  });
  emitToRoles(['manager'], 'alert:new', { category: alert.category, who: alert.who });
  return alert;
}

// Check-in reminder: 15 minutes before each slot closes (H:45)
async function reminderCheck() {
  if (new Date().getHours() >= 17) return;
  const settings = await Setting.get();
  const now = new Date();
  const slot = slotForNow(settings);
  if (slot === 12) return; // Lunch break: no reminders or alerts
  const devs = await activeDevelopers();
  const date = dayStr(now);
  for (const dev of devs) {
    const has = await WorkLog.findOne({ developer: dev._id, date, hourSlot: slot });
    if (!has) {
      const dedupeKey = `reminder:${dev._id}:${date}:${slot}`;
      if (!(await Alert.findOne({ dedupeKey }))) {
        await Alert.create({
          dedupeKey,
          audience: 'developer', user: dev._id, kind: 'reminder', read: false,
          title: 'Check-in Reminder',
          body: `${hourLabel(slot)} log due in 15 minutes — submit before ${hourLabel(slot)} closes.`
        });
        emitToUser(String(dev._id), 'alert:new', { kind: 'reminder' });
      }
    }
  }
}

// Missed log detection: at :00 of the next hour, flag the previous slot
async function missedLogCheck() {
  const now = new Date();
  if (now.getHours() >= 17 || now.getHours() === 12) return; // Skip after 5 PM and during lunch break (12 PM - 1 PM)
  const settings = await Setting.get();
  if (!isWorkday(now, settings)) return;

  const date = dayStr(now);
  const currentSlot = slotForNow(settings);
  const checkSlots = requiredSlots(settings).filter((s) => s < currentSlot);
  if (!checkSlots.length) return;
  const justEnded = checkSlots[checkSlots.length - 1];

  const devs = await activeDevelopers();
  for (const dev of devs) {
    const team = dev.team;
    if (!team) continue;
    const logs = await WorkLog.find({ developer: dev._id, date });
    const loggedSlots = new Set(logs.map((l) => l.hourSlot));
    const missing = checkSlots.filter((s) => !loggedSlots.has(s));
    if (!missing.includes(justEnded)) continue;

    const project = team.project ? await Project.findById(team.project) : null;
    const emptyList = missing.slice(-3).map((s) => hourLabel(s)).join(', ');

    await createLeaderAlert({
      dedupeKey: `missed:${dev._id}:${date}:${justEnded}`,
      team: team._id,
      project: project ? project._id : undefined,
      developerId: dev._id,
      severity: 'critical',
      category: 'Missed Log',
      who: dev.name,
      title: missing.length > 1 ? `${dev.name} — ${missing.length} logs missing` : `${dev.name} — Missed Check-in`,
      body: missing.length > 1
        ? `${emptyList} slots all empty`
        : `${hourLabel(justEnded)} log not submitted`,
      meta: `${fmtTime(now)} · ${project ? project.name : 'Project'} · ${team.name}`,
      detection: `Cron job at ${fmtTime(now)} found no WorkLog for ${dev.name} hourSlot:${justEnded}. Alert pushed via Socket.IO.`,
      actions: [`View ${dev.name.split(' ')[0]}`, 'Send Reminder', 'Mark Seen']
    });

    await createManagerAlert(dev, {
      dedupeKey: `idle-missed:${dev._id}:${date}:${justEnded}`,
      developerId: dev._id,
      category: 'Missed Check-in',
      severity: 'high',
      who: dev.name,
      idleTime: `${missing.length} slots empty`,
      lastActive: dev.lastSeenAt && dayStr(dev.lastSeenAt) === date ? fmtTime(dev.lastSeenAt) : 'Not active today',
      title: `${dev.name} — Missed Check-in`,
      body: missing.length > 1
        ? `${missing.length} consecutive check-in slots missed. No logs submitted today.`
        : `${hourLabel(justEnded)} check-in missed.`,
      detection: 'Automated hourly detection of empty check-in slots.'
    });
  }
}

// EOD missing check: after the EOD deadline
async function eodMissingCheck() {
  if (new Date().getHours() >= 17) return;
  const settings = await Setting.get();
  const now = new Date();
  if (!isWorkday(now, settings)) return;
  const date = dayStr(now);

  const devs = await activeDevelopers();
  for (const dev of devs) {
    const team = dev.team;
    if (!team) continue;
    const hasEod = await EodReport.findOne({ developer: dev._id, date });
    if (hasEod) continue;
    const project = team.project ? await Project.findById(team.project) : null;

    await createLeaderAlert({
      dedupeKey: `eod:${dev._id}:${date}`,
      team: team._id,
      project: project ? project._id : undefined,
      developerId: dev._id,
      severity: 'warning',
      category: 'EOD Missing',
      who: dev.name,
      title: `${dev.name} — EOD Missing`,
      body: `No EOD report submitted for ${fmtDateMDY(now)}`,
      meta: `${fmtTime(now)} · ${project ? project.name : 'Project'} · ${team.name}`,
      detection: `Scheduled job at ${fmtTime(now)} found no EODReport document for today.`,
      actions: [`View ${dev.name.split(' ')[0]}`, 'Mark Seen']
    });

    await createDevAlert(dev, {
      kind: 'eod',
      unread: true,
      title: 'EOD Reminder',
      body: `Submit your EOD report for today before the deadline.`
    });
  }
}

// Idle detection for managers: developer with stale heartbeat during work hours
async function idleCheck() {
  const now = new Date();
  if (now.getHours() >= 17 || now.getHours() === 12) return; // Skip after 5 PM and during lunch break (12 PM - 1 PM)
  const settings = await Setting.get();
  if (!isWorkday(now, settings)) return;
  const date = dayStr(now);

  const devs = await activeDevelopers();
  for (const dev of devs) {
    const team = dev.team;
    if (!team) continue;
    const seenAt = dev.lastSeenAt;
    const idleMinutes = seenAt ? Math.floor((now.getTime() - seenAt.getTime()) / 60000) : 999;
    const threshold = settings.idleMinutes;
    // Only flag after some activity today or clearly absent
    const isIdle = idleMinutes >= threshold && idleMinutes < 8 * 60;
    const notSeenToday = !seenAt || dayStr(seenAt) !== date;
    if (!isIdle && !notSeenToday) continue;
    if (isIdle && (!seenAt || seenAt.getHours() < settings.workStartHour)) continue;

    await createManagerAlert(dev, {
      dedupeKey: `idle:${dev._id}:${date}:${isIdle ? 'idle' : 'absent'}`,
      developerId: dev._id,
      category: 'Idle',
      severity: isIdle ? 'medium' : 'high',
      who: dev.name,
      idleTime: isIdle ? `${idleMinutes} minutes` : 'No session today',
      lastActive: seenAt && dayStr(seenAt) === date ? `${fmtTime(seenAt)} (stale heartbeat)` : 'Not active today',
      title: `${dev.name} — Idle`,
      body: isIdle
        ? `Developer has been idle for ${idleMinutes} minutes without logging current task progress.`
        : 'No session heartbeat today. Developer may be absent.',
      detection: 'Automated session heartbeat monitor (Socket.IO presence).'
    });
  }
}

function start() {
  const settings = Setting.get();
  void settings;
  cron.schedule('45 8-16 * * *', () => reminderCheck().catch((e) => console.error('[cron]', e)));
  cron.schedule('0 9-17 * * *', () => missedLogCheck().catch((e) => console.error('[cron]', e)));
  cron.schedule('35 16 * * *', () => eodMissingCheck().catch((e) => console.error('[cron]', e)));
  cron.schedule('*/10 8-17 * * *', () => idleCheck().catch((e) => console.error('[cron]', e)));
  console.log('[cron] Detection jobs scheduled (reminders, missed logs, EOD, idle)');
}

module.exports = { start, reminderCheck, missedLogCheck, eodMissingCheck, idleCheck };
