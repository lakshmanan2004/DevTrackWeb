const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { WorkLog, Commit, EodReport, User, Team, Project } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { scopeFor } = require('../util/scope');
const { dayStr, fromDayStr, fmtDateLong, fmtDuration } = require('../util/time');

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
    if (devObjectIds.length) filter.developer = { $in: devObjectIds };
  } else if (req.user.role === 'developer') {
    filter.developer = toObjId(req.user._id);
  } else if (req.user.role === 'manager') {
    const projObjectIds = (scope.projectIds || []).map(toObjId);
    if (projObjectIds.length) filter.project = { $in: projObjectIds };
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
        model: 'gemini-2.5-flash',
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
          model: 'gemini-2.5-flash'
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

module.exports = router;
