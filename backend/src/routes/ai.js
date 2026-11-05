const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { WorkLog, Commit, EodReport, User, Team, Project, Setting } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { scopeFor } = require('../util/scope');
const { dayStr, fromDayStr, fmtDateLong, fmtDuration, resolveTaskTitle } = require('../util/time');

const router = express.Router();
router.use(authRequired, attachUser);

// Local NLP Heuristic Fallback in case GEMINI_API_KEY is not configured or network error occurs
function localNlpConsolidation(logs, commits, eods, dateStr) {
  const totalLogs = logs.length;
  const doneLogs = logs.filter((l) => l.status === 'done' || l.review === 'approved');
  const inProgLogs = logs.filter((l) => l.status === 'progress' || l.status === 'todo');
  const blockedLogs = logs.filter((l) => l.status === 'blocked' || !!l.blocker);
  const pendingReviewLogs = logs.filter((l) => l.review === 'pending' || l.review === 'changes_requested');

  const devsMap = new Map();
  logs.forEach((l) => {
    const devId = String(l.developer?._id || l.developer || 'unknown');
    const devName = l.developer?.name || 'Developer';
    devsMap.set(devId, devName);
  });

  // Group by Module
  const moduleMap = new Map();
  logs.forEach((l) => {
    let modName = (l.moduleName || '').trim();
    if (!modName) {
      const taskLower = (l.task || '').toLowerCase();
      if (taskLower.includes('auth') || taskLower.includes('login') || taskLower.includes('jwt')) modName = 'Authentication & Security';
      else if (taskLower.includes('ui') || taskLower.includes('dashboard') || taskLower.includes('component') || taskLower.includes('calendar')) modName = 'User Interface & Dashboard';
      else if (taskLower.includes('api') || taskLower.includes('backend') || taskLower.includes('route') || taskLower.includes('socket')) modName = 'Backend & API Services';
      else if (taskLower.includes('database') || taskLower.includes('mongo') || taskLower.includes('schema') || taskLower.includes('index')) modName = 'Database & Data Layer';
      else if (taskLower.includes('test') || taskLower.includes('bug') || taskLower.includes('fix')) modName = 'Testing & Quality Assurance';
      else modName = 'Core Application Features';
    }

    if (!moduleMap.has(modName)) {
      moduleMap.set(modName, {
        module: modName,
        tasks: [],
        completed: 0,
        totalMinutes: 0
      });
    }
    const item = moduleMap.get(modName);
    item.tasks.push(l);
    if (l.status === 'done') item.completed += 1;
    item.totalMinutes += l.activeMinutes || 0;
  });

  const mainModulesAndFocusAreas = Array.from(moduleMap.values()).map((m) => {
    const taskTitles = m.tasks.map((t) => t.task).filter(Boolean);
    const uniqueTitles = Array.from(new Set(taskTitles));
    const focusSummary = uniqueTitles.slice(0, 3).join(', ') || 'Feature updates and code implementation';
    const isCompleted = m.completed === m.tasks.length && m.tasks.length > 0;
    return {
      module: m.module,
      focus: focusSummary,
      status: isCompleted ? 'completed' : m.completed > 0 ? 'in_progress' : 'in_progress',
      completedTasksCount: m.completed,
      totalTasksCount: m.tasks.length,
      activeHours: fmtDuration(m.totalMinutes),
      highlights: uniqueTitles.slice(0, 3)
    };
  });

  // Extract InProgress & Pending Tasks
  const inProgressAndPendingWorks = [];
  
  blockedLogs.forEach((l) => {
    inProgressAndPendingWorks.push({
      id: String(l._id),
      task: l.task || 'Task with active blocker',
      developerName: l.developer?.name || 'Developer',
      developerInitials: l.developer?.initials || 'DV',
      status: 'blocked',
      review: l.review || 'pending',
      blocker: l.blocker || 'Impediment reported by developer',
      hourLabel: l.hourLabel || '',
      priority: 'high',
      nextAction: 'Remove blocker with Team Lead guidance'
    });
  });

  inProgLogs.forEach((l) => {
    if (!blockedLogs.some((b) => String(b._id) === String(l._id))) {
      inProgressAndPendingWorks.push({
        id: String(l._id),
        task: l.task || 'Ongoing work item',
        developerName: l.developer?.name || 'Developer',
        developerInitials: l.developer?.initials || 'DV',
        status: 'in_progress',
        review: l.review || 'pending',
        blocker: null,
        hourLabel: l.hourLabel || '',
        priority: 'medium',
        nextAction: 'Continue implementation for current sprint'
      });
    }
  });

  pendingReviewLogs.forEach((l) => {
    if (!inProgressAndPendingWorks.some((item) => item.id === String(l._id))) {
      inProgressAndPendingWorks.push({
        id: String(l._id),
        task: l.task || 'Completed work awaiting review',
        developerName: l.developer?.name || 'Developer',
        developerInitials: l.developer?.initials || 'DV',
        status: 'pending_review',
        review: l.review,
        blocker: null,
        hourLabel: l.hourLabel || '',
        priority: 'low',
        nextAction: l.review === 'changes_requested' ? 'Review feedback and resubmit' : 'Awaiting Team Leader approval'
      });
    }
  });

  const percent = totalLogs > 0 ? Math.round((doneLogs.length / totalLogs) * 100) : 0;
  const executiveSummary = totalLogs === 0
    ? `No check-ins or work logs recorded on ${dateStr}.`
    : `On ${dateStr}, the team completed ${doneLogs.length} of ${totalLogs} logged tasks (${percent}% completion rate) across ${mainModulesAndFocusAreas.length} core module(s) with ${commits.length} code commit(s). ${blockedLogs.length > 0 ? `${blockedLogs.length} active blocker(s) require attention.` : 'All active work is progressing smoothly without blocking dependencies.'}`;

  return {
    date: dateStr,
    totalLogs,
    totalDevs: devsMap.size,
    totalCommits: commits.length,
    completionRate: percent,
    executiveSummary,
    mainModulesAndFocusAreas,
    inProgressAndPendingWorks,
    aiPowered: false,
    model: 'nlp-heuristic-engine'
  };
}

// GET /api/ai/daily-summary?date=YYYY-MM-DD&developerId=
router.get('/daily-summary', ah(async (req, res) => {
  const targetDate = req.query.date || dayStr();
  const scope = await scopeFor(req.user);
  const mongoose = require('mongoose');
  const toObjId = (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);

  const filter = { date: targetDate };

  if (req.query.developerId) {
    filter.developer = toObjId(req.query.developerId);
  } else if (req.user.role === 'leader') {
    const devObjectIds = (scope.developerIds || []).map(toObjId);
    filter.developer = { $in: devObjectIds };
  } else if (req.user.role === 'developer') {
    filter.developer = toObjId(req.user._id);
  } else if (req.user.role === 'manager') {
    const projObjectIds = (scope.projectIds || []).map(toObjId);
    filter.project = { $in: projObjectIds };
  }

  const [logs, commits, eods] = await Promise.all([
    WorkLog.find(filter)
      .sort({ hourSlot: 1, submittedAt: 1 })
      .populate('developer', 'name initials email')
      .populate('project', 'name'),
    Commit.find(filter).populate('developer', 'name initials'),
    EodReport.find(filter).populate('developer', 'name initials')
  ]);

  const dateLabel = fmtDateLong(fromDayStr(targetDate));

  if (logs.length === 0) {
    return res.json({
      summary: {
        date: targetDate,
        dateLabel,
        totalLogs: 0,
        totalDevs: 0,
        totalCommits: commits.length,
        completionRate: 0,
        executiveSummary: `No work check-ins or activity logs recorded for ${dateLabel}. Select another date on the calendar to view AI consolidated summary.`,
        mainModulesAndFocusAreas: [],
        inProgressAndPendingWorks: [],
        aiPowered: false,
        model: 'nlp-standby'
      }
    });
  }

  // If GEMINI_API_KEY is available in environment, use Gemini NLP
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const client = new GoogleGenAI({ apiKey });

      const logsContext = logs.map((l) => ({
        developer: l.developer?.name || 'Developer',
        task: l.task,
        description: l.description,
        moduleName: l.moduleName || 'Unassigned Module',
        status: l.status,
        review: l.review,
        activeMinutes: l.activeMinutes || 0,
        blocker: l.blocker || null,
        commits: l.commits || 0
      }));

      const commitsContext = commits.map((c) => ({
        developer: c.developer?.name || 'Developer',
        message: c.message,
        branch: c.branch
      }));

      const prompt = `You are an expert engineering management AI and NLP analyzer.
Analyze the following developer work logs, commits, and status reports for date: ${targetDate} (${dateLabel}).

WORK LOGS DATA:
${JSON.stringify(logsContext, null, 2)}

COMMITS DATA:
${JSON.stringify(commitsContext, null, 2)}

TASK:
Produce a consolidated, structured NLP daily standup & work summary for the Team Leader in clean JSON format matching this schema:
{
  "executiveSummary": "2-3 crisp, professional sentences summarizing key milestones accomplished, overall team momentum, and any critical blockers.",
  "mainModulesAndFocusAreas": [
    {
      "module": "Name of module or feature area (e.g., Authentication, Dashboard UI, Database, APIs)",
      "focus": "Clear summary of focus area and key technical deliverables",
      "status": "completed" | "in_progress" | "blocked",
      "completedTasksCount": number,
      "totalTasksCount": number,
      "activeHours": "e.g., 3h 30m",
      "highlights": ["Key accomplishment bullet 1", "Key accomplishment bullet 2"]
    }
  ],
  "inProgressAndPendingWorks": [
    {
      "task": "Task title or description",
      "developerName": "Developer name",
      "status": "in_progress" | "pending_review" | "blocked",
      "blocker": "Blocker text or null if none",
      "priority": "high" | "medium" | "low",
      "nextAction": "Recommended next step or guidance"
    }
  ]
}

Return ONLY valid JSON.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text;
      const parsed = JSON.parse(responseText);

      const doneCount = logs.filter((l) => l.status === 'done').length;
      const completionRate = Math.round((doneCount / logs.length) * 100);
      const devsCount = new Set(logs.map((l) => String(l.developer?._id || l.developer))).size;

      return res.json({
        summary: {
          date: targetDate,
          dateLabel,
          totalLogs: logs.length,
          totalDevs: devsCount,
          totalCommits: commits.length,
          completionRate,
          executiveSummary: parsed.executiveSummary || 'Daily AI consolidation generated.',
          mainModulesAndFocusAreas: parsed.mainModulesAndFocusAreas || [],
          inProgressAndPendingWorks: parsed.inProgressAndPendingWorks || [],
          aiPowered: true,
          model: 'gemini-3.8-flash'
        }
      });
    } catch (aiErr) {
      console.warn('[ai] Gemini API call failed, falling back to local NLP heuristic:', aiErr.message);
    }
  }

  // Fallback to local rule-based NLP consolidation
  const fallback = localNlpConsolidation(logs, commits, eods, targetDate);
  fallback.dateLabel = dateLabel;
  return res.json({ summary: fallback });
}));

// GET /api/ai/executive-digest?date=YYYY-MM-DD&projectId=&developerId=
router.get('/executive-digest', ah(async (req, res) => {
  const targetDate = req.query.date || dayStr();
  const scope = await scopeFor(req.user);
  const mongoose = require('mongoose');
  const toObjId = (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

  const filter = { date: targetDate };

  if (req.query.projectId) {
    const projId = toObjId(req.query.projectId);
    if (projId) filter.project = projId;
  } else if (req.user.role === 'manager') {
    const projObjectIds = (scope.projectIds || []).map(toObjId).filter(Boolean);
    if (projObjectIds.length) filter.project = { $in: projObjectIds };
  }

  if (req.query.developerId) {
    const devId = toObjId(req.query.developerId);
    if (devId) filter.developer = devId;
  } else if (req.user.role === 'leader') {
    const devObjectIds = (scope.developerIds || []).map(toObjId).filter(Boolean);
    if (devObjectIds.length) filter.developer = { $in: devObjectIds };
  } else if (req.user.role === 'developer') {
    filter.developer = req.user._id;
  }

  const [logs, commits, eods, setting] = await Promise.all([
    WorkLog.find(filter)
      .sort({ hourSlot: 1, submittedAt: 1 })
      .populate('developer', 'name initials email')
      .populate('project', 'name'),
    Commit.find(filter).populate('developer', 'name initials'),
    EodReport.find(filter).populate('developer', 'name initials'),
    Setting.get()
  ]);

  const dateLabel = fmtDateLong(fromDayStr(targetDate));
  const totalMinutes = logs.reduce((sum, l) => sum + (l.activeMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const completedLogs = logs.filter((l) => l.status === 'done' || l.review === 'approved');
  const blockedLogs = logs.filter((l) => l.status === 'blocked' || !!l.blocker);
  const devsSet = new Set(logs.map((l) => l.developer?.name || 'Developer'));

  if (logs.length === 0) {
    return res.json({
      digest: {
        date: targetDate,
        dateLabel,
        headline: `No engineering activity or work logs recorded for ${dateLabel}.`,
        bullets: {
          shipped: `No tasks or deliverables were logged as completed today.`,
          velocity: `0 active hours tracked across 0 developers with ${commits.length} code commit(s).`,
          blockers: `No blockers reported.`
        },
        highlights: ['Awaiting team check-ins for the active sprint.'],
        slackMarkdown: `*📋 DevTrack Executive Briefing — ${dateLabel}*\n\n_No check-ins recorded for this date._`,
        stats: {
          totalHours: 0,
          totalLogs: 0,
          totalCommits: commits.length,
          activeDevsCount: 0,
          blockersCount: 0,
          completionRate: 0
        },
        aiPowered: false,
        model: 'system-standby',
        generatedAt: new Date().toISOString()
      }
    });
  }

  const completionRate = Math.round((completedLogs.length / logs.length) * 100);

  const moduleCounts = {};
  logs.forEach((l) => {
    const mod = l.moduleName || 'Core Feature';
    moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
  });
  const topModules = Object.entries(moduleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} (${count} logs)`)
    .slice(0, 3)
    .join(', ') || 'Core Modules';

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const client = new GoogleGenAI({ apiKey });

      const logsContext = logs.map((l) => ({
        developer: l.developer?.name || 'Developer',
        project: l.project?.name || 'Project',
        module: l.moduleName || 'Core',
        task: l.task,
        description: l.description,
        status: l.status,
        review: l.review,
        activeMinutes: l.activeMinutes || 0,
        blocker: l.blocker || null,
        commitUrl: l.commitUrl || null
      }));

      const commitsContext = commits.map((c) => ({
        developer: c.developer?.name || 'Developer',
        message: c.message
      }));

      const prompt = `You are a Principal Engineering Director & Technical Co-pilot.
Generate a high-impact, C-level executive 3-bullet team briefing for management on date: ${targetDate} (${dateLabel}).
Organization: ${setting.companyName || 'DevTrack Workspace'}

LOGS DATA (${logs.length} total check-ins):
${JSON.stringify(logsContext.slice(0, 30), null, 2)}

COMMITS DATA (${commits.length} total commits):
${JSON.stringify(commitsContext.slice(0, 20), null, 2)}

JSON Output Schema:
{
  "headline": "A single compelling executive sentence summarizing today's overall engineering delivery, velocity, and health.",
  "bullets": {
    "shipped": "2-3 specific sentences detailing concrete technical accomplishments, APIs built, UI screens created, bug fixes, or code merged today.",
    "velocity": "2-3 sentences covering total active engineering effort (${totalHours} hrs), commits output (${commits.length} commits), primary modules worked (${topModules}), and team momentum.",
    "blockers": "2 sentences covering any blockers found (${blockedLogs.length} blocked logs), dependencies waiting on external keys/answers, or directives for Team Leads tomorrow morning. If no blockers, state clearly that all work streams are unblocked."
  },
  "highlights": [
    "Key deliverable 1",
    "Key deliverable 2",
    "Key deliverable 3"
  ]
}

Return ONLY valid JSON.`;

      const withTimeout = (p, ms = 7500) =>
        Promise.race([
          p,
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Gemini API call timed out after ${ms}ms`)), ms))
        ]);

      const response = await withTimeout(
        client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        })
      );

      const parsed = JSON.parse(response.text);

      const slackMarkdown = `*🚀 DevTrack Executive Team Briefing — ${dateLabel}*\n` +
        `_${parsed.headline || 'Daily Engineering Digest'}_\n\n` +
        `*1. 🚀 Shipped Deliverables:*\n${parsed.bullets?.shipped || ''}\n\n` +
        `*2. ⚡ Velocity & Focus:*\n${parsed.bullets?.velocity || ''}\n\n` +
        `*3. 🛑 Impediments & Directives:*\n${parsed.bullets?.blockers || ''}\n\n` +
        `📊 *Summary Metrics:* ${totalHours}h Tracked · ${completedLogs.length}/${logs.length} Completed (${completionRate}%) · ${commits.length} Commits · ${blockedLogs.length} Blockers`;

      return res.json({
        digest: {
          date: targetDate,
          dateLabel,
          headline: parsed.headline || `Engineering Team Digest for ${dateLabel}`,
          bullets: parsed.bullets || {
            shipped: `The team completed ${completedLogs.length} tasks across ${topModules}.`,
            velocity: `${totalHours} hours tracked across ${devsSet.size} active engineers with ${commits.length} commit(s).`,
            blockers: blockedLogs.length > 0 ? `${blockedLogs.length} active blocker(s) require intervention.` : 'All work streams proceeding without blockers.'
          },
          highlights: parsed.highlights || [
            `${completedLogs.length} tasks completed today`,
            `${totalHours} hours of deep technical work logged`,
            `${commits.length} code commits delivered`
          ],
          slackMarkdown,
          stats: {
            totalHours,
            totalLogs: logs.length,
            totalCommits: commits.length,
            activeDevsCount: devsSet.size,
            blockersCount: blockedLogs.length,
            completionRate
          },
          aiPowered: true,
          model: 'gemini-3.8-flash',
          generatedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.warn('[ai] Gemini executive digest failed, falling back to heuristic:', err.message);
    }
  }

  // Heuristic rule-based fallback
  const shippedTasks = completedLogs.map((l) => resolveTaskTitle(l.task, l.description)).filter(Boolean).slice(0, 4);
  const shippedText = shippedTasks.length > 0
    ? `The team successfully delivered ${completedLogs.length} tasks today, highlighting: ${shippedTasks.join(', ')}.`
    : `The team made solid progress on ongoing tasks across ${topModules}.`;

  const velocityText = `Engineers tracked ${totalHours} active hours with a ${completionRate}% task completion rate across ${devsSet.size} developer(s), producing ${commits.length} code commit(s).`;

  const blockersText = blockedLogs.length > 0
    ? `${blockedLogs.length} active blocker(s) reported: ${blockedLogs.map((b) => `${b.developer?.name}: ${b.blocker || b.task}`).join('; ')}. Immediate Team Lead review recommended.`
    : `Zero blockers reported today. All project work streams are clear and on track for tomorrow's standup.`;

  const slackMarkdown = `*🚀 DevTrack Executive Team Briefing — ${dateLabel}*\n\n` +
    `*1. 🚀 Shipped Deliverables:*\n${shippedText}\n\n` +
    `*2. ⚡ Velocity & Focus:*\n${velocityText}\n\n` +
    `*3. 🛑 Impediments & Directives:*\n${blockersText}\n\n` +
    `📊 *Summary Metrics:* ${totalHours}h Tracked · ${completedLogs.length}/${logs.length} Completed · ${commits.length} Commits · ${blockedLogs.length} Blockers`;

  return res.json({
    digest: {
      date: targetDate,
      dateLabel,
      headline: `${setting.companyName || 'Team'}: ${totalHours}h logged, ${completedLogs.length} tasks completed, ${blockedLogs.length} blockers.`,
      bullets: {
        shipped: shippedText,
        velocity: velocityText,
        blockers: blockersText
      },
      highlights: [
        `${completedLogs.length} tasks completed today`,
        `${totalHours} hours of focused engineering logged`,
        `${commits.length} verified code commits`
      ],
      slackMarkdown,
      stats: {
        totalHours,
        totalLogs: logs.length,
        totalCommits: commits.length,
        activeDevsCount: devsSet.size,
        blockersCount: blockedLogs.length,
        completionRate
      },
      aiPowered: false,
      model: 'heuristic-engine',
      generatedAt: new Date().toISOString()
    }
  });
}));

// POST /api/ai/generate-dev-eod — Auto-generate 1-click personal EOD summary for a developer
router.post('/generate-dev-eod', ah(async (req, res) => {
  const targetDate = req.body.date || dayStr();
  const devId = req.user._id;

  const [logs, commits] = await Promise.all([
    WorkLog.find({ developer: devId, date: targetDate }).sort({ hourSlot: 1 }),
    Commit.find({ developer: devId, date: targetDate })
  ]);

  if (logs.length === 0) {
    return res.status(400).json({
      error: 'No check-ins found for today. Submit at least one work block before generating your EOD.'
    });
  }

  const tasksList = logs.map((l) => `${l.task}: ${l.description}`).join('\n');
  const commitsList = commits.map((c) => c.message).join(', ') || 'No commits';
  const blockedLogs = logs.filter((l) => l.status === 'blocked' || l.blocker);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const client = new GoogleGenAI({ apiKey });
      const prompt = `You are a helpful software engineer assistant.
Write an authentic, professional End of Day (EOD) work report in first-person ("I completed...", "I worked on...") based on today's logged work blocks.
It must meet a strict minimum of 60 words.

TODAY'S LOGGED CHECK-INS:
${tasksList}

COMMITS:
${commitsList}

BLOCKERS:
${blockedLogs.map((b) => b.blocker || b.task).join('; ') || 'None'}

Return ONLY valid JSON matching:
{
  "summary": "Detailed, professional 60-80 words first-person summary of what I accomplished and debugged today.",
  "carryForward": "1-2 sentences on what I plan to tackle first thing tomorrow.",
  "blockers": "Any blockers or impediments, or empty string if none.",
  "rating": 4
}`;

      const withTimeout = (p, ms = 7500) =>
        Promise.race([
          p,
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Gemini API call timed out after ${ms}ms`)), ms))
        ]);

      const response = await withTimeout(
        client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        })
      );

      const parsed = JSON.parse(response.text);
      return res.json({
        summary: parsed.summary,
        carryForward: parsed.carryForward || '',
        blockers: parsed.blockers || (blockedLogs[0]?.blocker || ''),
        rating: parsed.rating || 4,
        aiPowered: true
      });
    } catch (err) {
      console.warn('[ai] Gemini dev EOD generator failed, using heuristic:', err.message);
    }
  }

  // Fallback
  const summaryParts = logs.map((l) => l.task).join(', ');
  const fallbackSummary = `Today I focused on ${logs.length} primary work blocks covering ${summaryParts}. I verified API endpoints, reviewed test scenarios, and pushed code changes for the active sprint. All completed items have been documented and linked with corresponding commits.`;

  res.json({
    summary: fallbackSummary,
    carryForward: 'Continue implementation on in-progress items and conduct integration tests.',
    blockers: blockedLogs[0]?.blocker || '',
    rating: blockedLogs.length > 0 ? 3 : 4,
    aiPowered: false
  });
}));

module.exports = router;
