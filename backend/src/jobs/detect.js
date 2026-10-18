// Automated detection jobs (node-cron). All alerts are deduped via Alert.dedupeKey.
const cron = require('node-cron');
const { WorkLog, EodReport, Alert, User, Team, Project, Setting, Leave } = require('../models');
const { dayStr, hourLabel, fmtTime, fmtDateMDY, slotForNow, requiredSlots, isWorkday } = require('../util/time');
const { emitToRoles, emitToUser } = require('../sockets');

const { getWorkBlocks, getLunchBreak, isAnyLogForBlock, blockLabel } = require('../util/workBlocks');

async function activeDevelopers() {
  return User.find({ role: 'developer', active: true }).populate('team');
}

async function createLeaderAlert(payload) {
  const exists = payload.dedupeKey ? await Alert.findOne({ dedupeKey: payload.dedupeKey }) : null;
  if (exists) return null;
  const alert = await Alert.create({ ...payload, audience: 'leader', read: false });
  emitToRoles(['leader'], 'alert:new', { category: alert.category, who: alert.who, title: alert.title, body: alert.body });
  return alert;
}

async function createDevAlert(user, payload) {
  const alert = await Alert.create({ ...payload, audience: 'developer', user: user._id, read: false });
  emitToUser(String(user._id), 'alert:new', { kind: alert.kind, title: alert.title, body: alert.body });
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
  emitToRoles(['manager'], 'alert:new', { category: alert.category, who: alert.who, title: alert.title, body: alert.body });
  return alert;
}

// Check-in reminder: 15 minutes before active work block closes
async function reminderCheck() {
  const now = new Date();
  const timeFloat = now.getHours() + now.getMinutes() / 60;
  if (timeFloat < 8.0 || timeFloat >= 17.0) return;
  const settings = await Setting.get();
  if (!isWorkday(now, settings)) return;
  const devs = await activeDevelopers();
  const date = dayStr(now);

  for (const dev of devs) {
    const devLunchSlot = dev.lunchSlot || 12;
    const lunch = getLunchBreak(devLunchSlot);
    if (timeFloat >= lunch.startHour && timeFloat < lunch.endHour) continue; // Lunch break: no reminders

    const blocks = getWorkBlocks(devLunchSlot);
    const activeBlock = blocks.find((b) => timeFloat >= b.startHour && timeFloat < b.endHour);
    if (!activeBlock) continue;

    // Check if developer is on leave for this slot
    const leave = await Leave.findOne({ developer: dev._id, date, status: 'approved' });
    if (leave && (leave.type === 'full_day' || (leave.slots && leave.slots.includes(activeBlock.slot)))) {
      continue; // Excused: on leave / half-day
    }

    const minutesLeft = Math.round((activeBlock.endHour - timeFloat) * 60);
    // Send reminder when 15 minutes or less remain in block
    if (minutesLeft <= 15 && minutesLeft > 0) {
      const devLogs = await WorkLog.find({ developer: dev._id, date });
      const has = isAnyLogForBlock(devLogs, activeBlock.slot, devLunchSlot);
      if (!has) {
        const dedupeKey = `reminder:${dev._id}:${date}:block${activeBlock.slot}`;
        if (!(await Alert.findOne({ dedupeKey }))) {
          const blockTitle = `${activeBlock.shortLabel} (${activeBlock.label})`;
          const alert = await Alert.create({
            dedupeKey,
            audience: 'developer',
            user: dev._id,
            kind: 'reminder',
            read: false,
            title: 'Check-in Reminder',
            body: `${blockTitle} log due in ${minutesLeft} minutes — submit before ${activeBlock.deadlineStr}.`
          });
          emitToUser(String(dev._id), 'alert:new', {
            kind: 'reminder',
            title: alert.title,
            body: alert.body
          });
        }
      }
    }
  }
}

// Missed log detection: flags closed work blocks after grace period (15m past block end)
async function missedLogCheck() {
  const now = new Date();
  const timeFloat = now.getHours() + now.getMinutes() / 60;
  if (timeFloat < 8.0) return;
  const settings = await Setting.get();
  if (!isWorkday(now, settings)) return;

  const date = dayStr(now);
  const devs = await activeDevelopers();

  for (const dev of devs) {
    const devLunchSlot = dev.lunchSlot || 12;
    const blocks = getWorkBlocks(devLunchSlot);
    const team = dev.team;
    if (!team) continue;

    // Check for approved leave/half-day on this date
    const leave = await Leave.findOne({ developer: dev._id, date, status: 'approved' });
    if (leave && leave.type === 'full_day') continue; // Entire day is excused
    const excusedSlots = new Set(leave && leave.slots ? leave.slots : []);

    const devLogs = await WorkLog.find({ developer: dev._id, date });

    // Block is closed and past grace period (15 minutes after deadline)
    const closedBlocks = blocks.filter(
      (b) => timeFloat >= (b.endHour + 0.24) && !excusedSlots.has(b.slot)
    );

    for (const block of closedBlocks) {
      const has = isAnyLogForBlock(devLogs, block.slot, devLunchSlot);
      if (!has) {
        const dedupeKey = `missed:${dev._id}:${date}:block${block.slot}`;
        if (await Alert.findOne({ dedupeKey })) continue;

        const project = team.project ? await Project.findById(team.project) : null;
        const blockLabelStr = `${block.shortLabel} (${block.label})`;

        await createLeaderAlert({
          dedupeKey,
          team: team._id,
          project: project ? project._id : undefined,
          developerId: dev._id,
          severity: 'critical',
          category: 'Missed Log',
          who: dev.name,
          title: `${dev.name} — Missed Check-in`,
          body: `${blockLabelStr} check-in not submitted (deadline was ${block.deadlineStr})`,
          meta: `${fmtTime(now)} · ${project ? project.name : 'Project'} · ${team.name}`,
          detection: `Automated detection found no WorkLog for ${dev.name} for ${blockLabelStr}. Alert pushed via Socket.IO.`,
          actions: [`View ${dev.name.split(' ')[0]}`, 'Send Reminder', 'Mark Seen']
        });

        await createManagerAlert(dev, {
          dedupeKey: `idle-missed:${dev._id}:${date}:block${block.slot}`,
          developerId: dev._id,
          category: 'Missed Check-in',
          severity: 'high',
          who: dev.name,
          idleTime: `Block ${block.slot} empty`,
          lastActive: dev.lastSeenAt && dayStr(dev.lastSeenAt) === date ? fmtTime(dev.lastSeenAt) : 'Not active today',
          title: `${dev.name} — Missed Check-in`,
          body: `${blockLabelStr} check-in missed (deadline was ${block.deadlineStr}).`,
          detection: 'Automated work block detection of empty check-in slots.'
        });
      }
    }
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

    // If on full day leave or afternoon leave, skip EOD missing alert
    const leave = await Leave.findOne({ developer: dev._id, date, status: 'approved' });
    if (leave && (leave.type === 'full_day' || leave.type === 'half_day_afternoon')) {
      continue;
    }

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
  if (now.getHours() >= 17) return; // Skip after 5 PM
  const settings = await Setting.get();
  if (!isWorkday(now, settings)) return;
  const date = dayStr(now);
  const currentHour = now.getHours();

  const devs = await activeDevelopers();
  for (const dev of devs) {
    const devLunchSlot = dev.lunchSlot || 12;
    if (currentHour === devLunchSlot) continue; // Skip during developer's lunch break
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
  // Check reminders and missed block logs every 5 minutes during workday (8:00 AM - 5:30 PM)
  cron.schedule('*/5 8-17 * * *', () => {
    reminderCheck().catch((e) => console.error('[cron reminder]', e));
    missedLogCheck().catch((e) => console.error('[cron missed]', e));
  });
  cron.schedule('35 16 * * *', () => eodMissingCheck().catch((e) => console.error('[cron eod]', e)));
  cron.schedule('*/10 8-17 * * *', () => idleCheck().catch((e) => console.error('[cron idle]', e)));
  console.log('[cron] Detection jobs scheduled (work block reminders, missed logs, EOD, idle)');
}

module.exports = { start, reminderCheck, missedLogCheck, eodMissingCheck, idleCheck };
