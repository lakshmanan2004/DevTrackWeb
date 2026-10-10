const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Project, Team, User, WorkLog, Task, Setting } = require('../models');
const { authRequired, attachUser, requireRole, ah } = require('../middleware/auth');
const { projectDto } = require('../util/dto');
const { scopeFor } = require('../util/scope');
const { dayStr, addDays, fmtDuration, initialsOf } = require('../util/time');
const { emitToRoles } = require('../sockets');

const router = express.Router();
router.use(authRequired, attachUser);

// ======================= PROJECTS =======================

async function projectStats(project, team) {
  const since = dayStr(addDays(new Date(), -7));
  const today = dayStr();
  const memberIds = team ? team.members : [];

  const [doneCount, blockedCount, progressLogs, activeDevs] = await Promise.all([
    WorkLog.countDocuments({ project: project._id, status: 'done' }),
    WorkLog.countDocuments({ project: project._id, status: 'blocked', date: { $gte: since } }),
    WorkLog.countDocuments({ project: project._id, status: 'progress', date: { $gte: since } }),
    memberIds.length
      ? User.countDocuments({
          _id: { $in: memberIds },
          lastSeenAt: { $gte: new Date(Date.now() - 45 * 60 * 1000) }
        })
      : Promise.resolve(0)
  ]);

  let progress = 0;
  if (project.status === 'completed') {
    progress = 100;
  } else if (project.modules && project.modules.length > 0) {
    const completedWeight = project.modules
      .filter((m) => m.status === 'completed')
      .reduce((acc, m) => acc + (m.weightPercentage || 0), 0);
    progress = Math.min(100, Math.round(completedWeight));
  } else {
    progress = Math.min(100, Math.round((doneCount / (project.plannedTasks || 40)) * 100));
  }

  let health = 'On Track';
  if (project.status === 'completed') {
    health = project.targetDate && project.endedAt && project.endedAt <= project.targetDate
      ? 'Delivered on time'
      : 'Behind';
  } else if (progress < 40) health = 'Behind';
  else if (progress < 65) health = 'Slightly Behind';

  return { progress, health, tasksDone: doneCount, blockers: blockedCount, activeDevs, inProgress: progressLogs };
}

async function fullProjectDto(project) {
  if (!project.modules || project.modules.length === 0) {
    project.modules = [
      { name: 'UI & Wireframe Design', description: 'Design mockups, wireframes & user experience flows', weightPercentage: 20, status: project.status === 'completed' ? 'completed' : 'completed' },
      { name: 'Frontend Implementation', description: 'React screens, components & responsive layout', weightPercentage: 30, status: project.status === 'completed' ? 'completed' : 'in_progress' },
      { name: 'Backend & API Integration', description: 'Database schema, authentication & REST API endpoints', weightPercentage: 35, status: project.status === 'completed' ? 'completed' : 'todo' },
      { name: 'QA & Final Deployment', description: 'Testing, bug fixes and cloud deployment', weightPercentage: 15, status: project.status === 'completed' ? 'completed' : 'todo' }
    ];
    try {
      await project.save();
    } catch (_err) {
      /* ignore save error if read-only */
    }
  }

  const team = project.team && project.team.members
    ? project.team
    : await Team.findById(project.team).populate('leader', 'name').populate('members', 'name');
  const manager = project.manager && project.manager.name
    ? project.manager
    : await User.findById(project.manager, 'name');
  const stats = await projectStats(project, team);

  const projectLogs = await WorkLog.find({ project: project._id }).populate('developer', 'name initials');
  const projectObj = project.toObject();

  if (projectObj.modules) {
    projectObj.modules = projectObj.modules.map((m) => {
      const matched = projectLogs.filter(
        (l) =>
          (l.moduleName === m.name || String(l.moduleName).toLowerCase() === String(m.name).toLowerCase()) &&
          (l.status === 'done' || l.status === 'completed') &&
          l.review === 'approved'
      );
      return {
        ...m,
        logsCount: matched.length,
        totalMinutes: matched.reduce((acc, l) => acc + (l.activeMinutes || 0), 0),
        submittedLogs: matched.map((l) => ({
          id: String(l._id),
          developerName: l.developer ? l.developer.name : 'Developer',
          initials: l.developer ? l.developer.initials : 'DV',
          description: l.description,
          task: l.task,
          status: l.status,
          submittedAt: l.submittedAt ? new Date(l.submittedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
          activeMinutes: l.activeMinutes || 0,
          attachmentUrl: l.attachmentUrl || '',
          commitUrl: l.commitUrl || '',
          review: l.review || 'pending'
        }))
      };
    });
  }

  return projectDto({ ...projectObj, manager }, team, stats);
}

// GET /api/projects?scope=mine|all
router.get('/projects', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  let filter = {};
  if (!(req.query.scope === 'all' && req.user.role === 'admin')) {
    filter = {
      $or: [
        { team: { $in: scope.teamIds } },
        { _id: { $in: scope.projectIds } }
      ]
    };
  }
  const projects = await Project.find(filter)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  const dtos = [];
  for (const p of projects) dtos.push(await fullProjectDto(p));
  res.json({ projects: dtos });
}));

// POST /api/projects — manager creates project + team + modules in one step
router.post('/projects', requireRole('manager', 'admin'), ah(async (req, res) => {
  const { name, description, startedAt, targetDate, repoUrl, status, teamName, leaderId, developerIds = [], modules, reallocateAssigned = false } = req.body || {};
  if (!name || !teamName || !leaderId) {
    return res.status(400).json({ error: 'Project name, team name, and leader are required' });
  }
  const leader = await User.findById(leaderId);
  if (!leader || leader.role !== 'leader') return res.status(400).json({ error: 'Select a valid team leader' });

  const safeDevIds = Array.isArray(developerIds) ? [...new Set(developerIds.map(String))] : [];

  // If any selected developers are currently assigned to other teams, reallocate them cleanly
  if (safeDevIds.length > 0) {
    const alreadyAssigned = await User.find({
      _id: { $in: safeDevIds },
      team: { $ne: null }
    });

    for (const dev of alreadyAssigned) {
      if (dev.team) {
        await Team.findByIdAndUpdate(dev.team, {
          $pull: { members: dev._id }
        });
      }
    }
  }

  const formattedModules = Array.isArray(modules)
    ? modules.map((m) => ({
        name: m.name,
        description: m.description || '',
        weightPercentage: Number(m.weightPercentage) || 0,
        status: m.status || 'todo'
      }))
    : [];

  if (formattedModules.length > 0) {
    const totalWeight = formattedModules.reduce((sum, m) => sum + (Number(m.weightPercentage) || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({
        error: `Total module weight must equal exactly 100% (currently ${totalWeight}%).`
      });
    }
  }

  const team = await Team.create({ name: teamName, leader: leaderId, members: safeDevIds });
  const project = await Project.create({
    name,
    description: description || '',
    status: status || 'ongoing',
    manager: req.user._id,
    team: team._id,
    repoUrl: repoUrl || '',
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    targetDate: targetDate ? new Date(targetDate) : null,
    plannedTasks: 40,
    modules: formattedModules
  });
  team.project = project._id;
  await team.save();

  if (safeDevIds.length > 0) {
    await User.updateMany({ _id: { $in: safeDevIds } }, { team: team._id });
  }
  await User.findByIdAndUpdate(leaderId, { team: team._id });

  const populated = await Project.findById(project._id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:new', { projectId: String(project._id) });
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'team:update', {});
  res.status(201).json({ project: await fullProjectDto(populated) });
}));

// PATCH /api/projects/:id/modules/:moduleId — Leader/Manager updates module status
router.patch('/projects/:id/modules/:moduleId', ah(async (req, res) => {
  const { status } = req.body || {};
  if (!['todo', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid module status' });
  }

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const module = project.modules.id(req.params.moduleId);
  if (!module) return res.status(404).json({ error: 'Module not found' });

  module.status = status;
  if (status === 'completed') {
    const devLogsCount = await WorkLog.countDocuments({
      project: project._id,
      moduleName: { $regex: new RegExp(`^${module.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      status: { $in: ['done', 'completed'] },
      review: 'approved'
    });
    if (devLogsCount === 0) {
      return res.status(400).json({
        error: `Cannot complete "${module.name}": At least 1 completed & TL-approved developer work log must be submitted for this module first.`
      });
    }
    module.completedAt = new Date();
    module.completedBy = req.user._id;
  } else {
    module.completedAt = null;
    module.completedBy = null;
  }

  const allDone = project.modules.length > 0 && project.modules.every((m) => m.status === 'completed');
  if (allDone) {
    project.status = 'completed';
    project.endedAt = new Date();
  } else if (project.status === 'completed' && !allDone) {
    project.status = 'ongoing';
    project.endedAt = null;
  }

  await project.save();

  if (allDone) {
    await restoreSprintMembers(project._id);
  }

  const populated = await Project.findById(project._id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:update', { projectId: String(project._id) });
  res.json({ project: await fullProjectDto(populated) });
}));

// Helper to restore sprint developers and team leaders back to their original projects
async function restoreSprintMembers(projectId) {
  try {
    const project = await Project.findById(projectId);
    if (!project || !project.team) return;

    const currentTeam = await Team.findById(project.team);
    if (!currentTeam) return;

    const memberIds = currentTeam.members || [];
    if (memberIds.length > 0) {
      const members = await User.find({ _id: { $in: memberIds } });
      for (const member of members) {
        if (member.previousTeam) {
          const oldTeam = await Team.findById(member.previousTeam).populate('project');
          if (oldTeam) {
            // Remove from current team
            currentTeam.members = currentTeam.members.filter((m) => String(m) !== String(member._id));

            // Add back to old team
            if (!oldTeam.members.some((m) => String(m) === String(member._id))) {
              oldTeam.members.push(member._id);
            }
            await oldTeam.save();

            // Update member
            member.team = oldTeam._id;
            member.previousTeam = null;
            member.previousProject = null;
            await member.save();

            // Alert developer
            await Alert.create({
              audience: 'developer',
              user: member._id,
              kind: 'reminder',
              title: 'Returned to Original Project',
              body: `Sprint Completed: "${project.name}" has been completed and closed. You have been automatically returned to your original project (${oldTeam.project?.name || oldTeam.name}).`
            });
            emitToUser(String(member._id), 'alert:new', { kind: 'reminder' });
          }
        }
      }
      await currentTeam.save();
    }

    // Check if Team Leader had a previousTeam to return to
    if (currentTeam.leader) {
      const leader = await User.findById(currentTeam.leader);
      if (leader && leader.previousTeam) {
        const oldLeaderTeam = await Team.findById(leader.previousTeam).populate('project');
        if (oldLeaderTeam) {
          leader.team = oldLeaderTeam._id;
          leader.previousTeam = null;
          leader.previousProject = null;
          await leader.save();

          await Alert.create({
            audience: 'leader',
            user: leader._id,
            kind: 'reminder',
            title: 'Returned to Original Project',
            body: `Sprint Completed: "${project.name}" has been completed and closed. You have been returned to your original project (${oldLeaderTeam.project?.name || oldLeaderTeam.name}).`
          });
          emitToUser(String(leader._id), 'alert:new', { kind: 'reminder' });
        }
      }
    }

    emitToRoles(['admin', 'manager', 'leader', 'developer'], 'team:update', {});
    emitToRoles(['admin', 'manager', 'leader', 'developer'], 'user:update', {});
  } catch (err) {
    console.error('Error in restoreSprintMembers:', err);
  }
}

// PATCH /api/projects/:id/status — Leader/Manager/Admin updates project overall status
router.patch('/projects/:id/status', ah(async (req, res) => {
  const { status } = req.body || {};
  if (!['ongoing', 'urgent', 'completed', 'hold'].includes(status)) {
    return res.status(400).json({ error: 'Invalid project status. Must be ongoing, urgent, completed, or hold' });
  }

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  project.status = status;
  if (status === 'completed') {
    project.endedAt = new Date();
    if (project.modules && project.modules.length > 0) {
      for (const mod of project.modules) {
        mod.status = 'completed';
        if (!mod.completedAt) mod.completedAt = new Date();
        if (!mod.completedBy) mod.completedBy = req.user._id;
      }
    }
  } else if (status === 'ongoing' || status === 'hold') {
    project.endedAt = null;
  }

  await project.save();

  if (status === 'completed') {
    await restoreSprintMembers(project._id);
  }

  const populated = await Project.findById(project._id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:update', { projectId: String(project._id) });
  res.json({ project: await fullProjectDto(populated) });
}));

// PATCH /api/projects/:id — Manager/Admin updates project details
router.patch('/projects/:id', requireRole('manager', 'admin'), ah(async (req, res) => {
  const { status, name, description, targetDate } = req.body || {};
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (targetDate !== undefined) project.targetDate = targetDate ? new Date(targetDate) : null;
  if (status) {
    if (!['ongoing', 'completed', 'hold', 'urgent'].includes(status)) {
      return res.status(400).json({ error: 'Invalid project status' });
    }
    project.status = status;
    if (status === 'completed') {
      project.endedAt = new Date();
      if (project.modules && project.modules.length > 0) {
        for (const mod of project.modules) {
          mod.status = 'completed';
          if (!mod.completedAt) mod.completedAt = new Date();
          if (!mod.completedBy) mod.completedBy = req.user._id;
        }
      }
    } else if (status === 'ongoing' || status === 'hold') {
      project.endedAt = null;
    }
  }

  await project.save();

  if (status === 'completed') {
    await restoreSprintMembers(project._id);
  }

  const populated = await Project.findById(project._id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:update', { projectId: String(project._id) });
  res.json({ project: await fullProjectDto(populated) });
}));

// DELETE /api/projects/:id — Admin & Project Manager delete project
router.delete('/projects/:id', requireRole('admin', 'manager'), ah(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // If manager, ensure they manage this project (admin can delete any project)
  if (req.user.role === 'manager' && project.manager && String(project.manager) !== String(req.user._id)) {
    return res.status(403).json({ error: 'You can only delete projects you manage' });
  }

  const teamId = project.team;
  if (teamId) {
    const team = await Team.findById(teamId);
    if (team) {
      // Free up all developer members
      if (team.members && team.members.length > 0) {
        await User.updateMany({ _id: { $in: team.members } }, { team: null });
      }
      // Free up team leader if this team was attached
      if (team.leader) {
        await User.findByIdAndUpdate(team.leader, { team: null });
      }
      // Delete associated team
      await Team.findByIdAndDelete(teamId);
    }
  }

  // Delete work logs for this project
  await WorkLog.deleteMany({ project: project._id });

  // Delete project
  await Project.findByIdAndDelete(project._id);

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'project:delete', { projectId: String(project._id) });
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'team:update', {});
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'user:update', {});

  res.json({ ok: true, message: 'Project and associated team deleted successfully' });
}));

// GET /api/projects/:id/overview — weekly breakdown + live blockers
router.get('/projects/:id/overview', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const project = await Project.findById(req.params.id)
    .populate('manager', 'name')
    .populate({ path: 'team', populate: { path: 'leader', select: 'name' } })
    .populate({ path: 'team', populate: { path: 'members', select: 'name' } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!scope.teamIds.some((t) => String(t) === String(project.team._id || project.team))) {
    return res.status(403).json({ error: 'Not in your scope' });
  }

  const weeks = [];
  for (let w = 4; w >= 0; w--) {
    const start = addDays(new Date(), -(w * 7 + 6));
    const end = addDays(new Date(), -(w * 7));
    const startStr = dayStr(start);
    const endStr = dayStr(end);
    const logs = await WorkLog.find({
      project: project._id,
      date: { $gte: startStr, $lte: endStr }
    });
    const tasks = logs.filter((l) => l.status === 'done').length;
    const blockers = logs.filter((l) => l.status === 'blocked').length;
    weeks.push({
      label: w === 0 ? 'This Week' : `Week ${5 - w}`,
      tasks,
      blockers,
      health: blockers >= 3 ? 'Behind' : blockers >= 1 ? 'Slow' : 'Good'
    });
  }

  const blockedLogs = await WorkLog.find({ project: project._id, status: 'blocked' })
    .sort({ date: -1 })
    .limit(10)
    .populate('developer', 'name');
  const blockers = blockedLogs.map((l) => ({
    id: String(l._id),
    title: l.blocker || l.task,
    since: `Since ${l.date}`,
    team: project.team.name,
    state: 'Unresolved'
  }));

  res.json({
    project: await fullProjectDto(project),
    weeks,
    blockers
  });
}));

// ======================= DIRECTORY (manager/admin) =======================

// GET /api/directory — leaders & developers available for team building
router.get('/directory', requireRole('manager', 'admin'), ah(async (_req, res) => {
  const users = await User.find({ role: { $in: ['leader', 'developer'] }, active: true })
    .populate({ path: 'team', select: 'name project', populate: { path: 'project', select: 'name status' } })
    .populate({ path: 'previousTeam', select: 'name project', populate: { path: 'project', select: 'name' } });

  res.json({
    users: users.map((u) => {
      const teamObj = u.team && typeof u.team === 'object' ? u.team : null;
      const projObj = teamObj && teamObj.project && typeof teamObj.project === 'object' ? teamObj.project : null;
      const prevTeamObj = u.previousTeam && typeof u.previousTeam === 'object' ? u.previousTeam : null;
      const prevProjObj = prevTeamObj && prevTeamObj.project && typeof prevTeamObj.project === 'object' ? prevTeamObj.project : null;

      return {
        id: String(u._id),
        name: u.name,
        role: u.role,
        initials: u.initials,
        teamName: teamObj ? teamObj.name : '',
        projectName: projObj ? projObj.name : (teamObj ? teamObj.name : ''),
        hasProject: !!teamObj && (!projObj || projObj.status !== 'completed'),
        previousTeamId: prevTeamObj ? String(prevTeamObj._id) : '',
        previousTeamName: prevTeamObj ? prevTeamObj.name : '',
        previousProjectName: prevProjObj ? prevProjObj.name : (prevTeamObj ? prevTeamObj.name : '')
      };
    })
  });
}));

// ======================= TEAMS =======================

// GET /api/teams
router.get('/teams', ah(async (req, res) => {
  const scope = await scopeFor(req.user);
  const teams = await Team.find({ _id: { $in: scope.teamIds } })
    .populate('leader', 'name initials email')
    .populate('members', 'name initials email role')
    .populate('project', 'name');

  // Find all previous developers for these teams
  const allDevs = await User.find({ role: 'developer', active: true })
    .populate('team', 'name')
    .populate('previousTeam', 'name');

  res.json({
    teams: teams.map((t) => {
      const teamIdStr = String(t._id);
      const memberIdSet = new Set((t.members || []).map((m) => String(m._id)));

      // Developers whose previousTeam is this team, and are currently not on this team
      const prevDevs = allDevs
        .filter((d) => d.previousTeam && String(d.previousTeam._id || d.previousTeam) === teamIdStr && !memberIdSet.has(String(d._id)))
        .map((d) => ({
          id: String(d._id),
          name: d.name,
          initials: d.initials,
          currentTeamName: d.team ? d.team.name : 'Unassigned'
        }));

      return {
        id: String(t._id),
        name: t.name,
        project: t.project ? t.project.name : '',
        leader: t.leader ? { id: String(t.leader._id), name: t.leader.name, initials: t.leader.initials } : null,
        members: (t.members || []).map((m) => ({ id: String(m._id), name: m.name, initials: m.initials, email: m.email })),
        previousMembers: prevDevs
      };
    })
  });
}));

// PATCH /api/teams/:id — change leader, add/remove member
router.patch('/teams/:id', requireRole('manager', 'admin'), ah(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  if (req.body.leaderId) {
    const leader = await User.findById(req.body.leaderId);
    if (!leader || leader.role !== 'leader') return res.status(400).json({ error: 'Select a valid team leader' });
    team.leader = leader._id;
    leader.team = team._id;
    await leader.save();
  }
  if (req.body.addMemberId) {
    const dev = await User.findById(req.body.addMemberId);
    if (dev && dev.team && String(dev.team) !== String(team._id)) {
      return res.status(400).json({ error: `${dev.name} is already assigned to another project team. A developer can only work on one project.` });
    }
    if (!team.members.some((m) => String(m) === String(req.body.addMemberId))) {
      team.members.push(req.body.addMemberId);
      await User.findByIdAndUpdate(req.body.addMemberId, { team: team._id });
    }
  }
  if (req.body.removeMemberId) {
    team.members = team.members.filter((m) => String(m) !== String(req.body.removeMemberId));
    await User.findByIdAndUpdate(req.body.removeMemberId, { team: null });
  }
  await team.save();

  const populated = await Team.findById(team._id)
    .populate('leader', 'name initials')
    .populate('members', 'name initials email')
    .populate('project', 'name');
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'team:update', { teamId: String(team._id) });
  res.json({
    team: {
      id: String(populated._id),
      name: populated.name,
      project: populated.project ? populated.project.name : '',
      leader: populated.leader ? { id: String(populated.leader._id), name: populated.leader.name, initials: populated.leader.initials } : null,
      members: (populated.members || []).map((m) => ({ id: String(m._id), name: m.name, initials: m.initials, email: m.email }))
    }
  });
}));

// POST /api/teams/transfer — seamlessly transfer developer to another project team with task handover
router.post('/teams/transfer', requireRole('manager', 'admin'), ah(async (req, res) => {
  const { developerId, fromTeamId, toTeamId, handoverToDevId, note } = req.body || {};
  if (!developerId || !toTeamId) {
    return res.status(400).json({ error: 'Developer ID and target Team ID are required' });
  }

  const dev = await User.findById(developerId);
  if (!dev || dev.role !== 'developer') {
    return res.status(404).json({ error: 'Developer not found' });
  }

  const toTeam = await Team.findById(toTeamId).populate('project');
  if (!toTeam) return res.status(404).json({ error: 'Target team not found' });

  let fromTeam = fromTeamId ? await Team.findById(fromTeamId).populate('project') : null;
  if (!fromTeam && dev.team) {
    fromTeam = await Team.findById(dev.team).populate('project');
  }

  // Remove from old team
  if (fromTeam) {
    fromTeam.members = fromTeam.members.filter((m) => String(m) !== String(developerId));
    await fromTeam.save();
    dev.previousTeam = fromTeam._id;
    dev.previousProject = fromTeam.project?._id || null;
  }

  // Add to new team
  if (!toTeam.members.some((m) => String(m) === String(developerId))) {
    toTeam.members.push(developerId);
  }
  await toTeam.save();

  // Update user team
  dev.team = toTeam._id;
  await dev.save();

  // If handover dev is selected, reassign pending tasks from previous project
  let handedOverCount = 0;
  if (handoverToDevId) {
    const handoverDev = await User.findById(handoverToDevId);
    if (handoverDev) {
      const pendingTasks = await Task.find({
        assignee: developerId,
        status: { $in: ['pending', 'in_progress'] }
      });
      for (const t of pendingTasks) {
        t.assignee = handoverDev._id;
        t.note = (t.note ? t.note + ' · ' : '') + `[Handed over from ${dev.name}]`;
        await t.save();
        handedOverCount++;
      }
      if (handedOverCount > 0) {
        emitToUser(String(handoverDev._id), 'task:assigned', {
          title: `Handover Tasks from ${dev.name}`,
          count: handedOverCount
        });
      }
    }
  }

  // Notify the developer about project allocation
  await Alert.create({
    audience: 'developer',
    user: dev._id,
    kind: 'reminder',
    title: 'Project Assignment Update',
    body: `You have been allocated to ${toTeam.project?.name || toTeam.name}. ${note || 'Your future hourly check-ins will be logged under this project.'}`
  });
  emitToUser(String(dev._id), 'alert:new', { kind: 'reminder' });

  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'team:update', {
    fromTeamId: fromTeam ? String(fromTeam._id) : undefined,
    toTeamId: String(toTeam._id)
  });
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'task:update', {});

  res.json({
    ok: true,
    message: `Successfully transferred ${dev.name} to ${toTeam.project?.name || toTeam.name}${handedOverCount > 0 ? ` and handed over ${handedOverCount} pending task(s).` : '.'}`
  });
}));

// ======================= USERS (admin) =======================

// PATCH /api/users/profile — any logged-in user updates own name/github/lunchSlot
router.patch('/users/profile', ah(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.body.name) {
    user.name = req.body.name;
    user.initials = initialsOf(req.body.name);
  }
  if (typeof req.body.github === 'string') user.github = req.body.github;
  if ([11, 12, '11', '12'].includes(req.body.lunchSlot)) {
    user.lunchSlot = Number(req.body.lunchSlot);
  }
  await user.save();
  res.json({ ok: true, lunchSlot: user.lunchSlot || 12 });
}));

// PATCH /api/users/lunch — quick switch lunch time (11 or 12)
router.patch('/users/lunch', ah(async (req, res) => {
  const { lunchSlot } = req.body || {};
  if (![11, 12, '11', '12'].includes(lunchSlot)) {
    return res.status(400).json({ error: 'Lunch slot must be 11 (11 AM - 12 PM) or 12 (12 PM - 1 PM)' });
  }
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.lunchSlot = Number(lunchSlot);
  await user.save();
  emitToUser(String(user._id), 'user:update', { lunchSlot: user.lunchSlot });
  res.json({ ok: true, lunchSlot: user.lunchSlot });
}));

// PATCH /api/users/password — any logged-in user changes own password
router.patch('/users/password', ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Current password and a new password (min 6 chars) are required' });
  }
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();
  res.json({ ok: true });
}));

// GET /api/users
router.get('/users', requireRole('admin'), ah(async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      initials: u.initials,
      email: u.email,
      role: u.role,
      active: u.active,
      joined: u.joinedAt ? u.joinedAt.toDateString().slice(4) : ''
    }))
  });
}));

// POST /api/users — add user
router.post('/users', requireRole('admin'), ah(async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !role) return res.status(400).json({ error: 'Name, email and role are required' });
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ error: 'A user with this email already exists' });
  const hash = await bcrypt.hash(password || 'welcome', 10);
  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    passwordHash: hash,
    role,
    initials: initialsOf(name)
  });
  emitToRoles(['admin'], 'user:new', {});
  res.status(201).json({
    user: { id: String(user._id), name: user.name, initials: user.initials, email: user.email, role: user.role, active: user.active, joined: user.joinedAt.toDateString().slice(4) }
  });
}));

// PATCH /api/users/:id — activate/deactivate/role change / promotions
router.patch('/users/:id', requireRole('admin'), ah(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const oldRole = user.role;
  const newRole = req.body.role;

  if (typeof req.body.active === 'boolean') user.active = req.body.active;
  if (req.body.name) {
    user.name = req.body.name;
    user.initials = initialsOf(req.body.name);
  }

  if (newRole && ['developer', 'leader', 'manager', 'admin'].includes(newRole) && newRole !== oldRole) {
    user.role = newRole;

    if (oldRole === 'developer') {
      // If a Developer was promoted to Leader/Manager/Admin, track previous team and remove from members list
      if (user.team) {
        user.previousTeam = user.team;
        await Team.findByIdAndUpdate(user.team, {
          $pull: { members: user._id }
        });
      }
    } else if (newRole === 'developer') {
      // If returning to developer role, re-attach to previous team or current team members
      const targetTeamId = user.previousTeam || user.team;
      if (targetTeamId) {
        user.team = targetTeamId;
        await Team.findByIdAndUpdate(targetTeamId, {
          $addToSet: { members: user._id }
        });
      } else {
        // Find existing team where they were associated
        const existingTeam = await Team.findOne({
          $or: [{ members: user._id }, { leader: user._id }]
        });
        if (existingTeam) {
          user.team = existingTeam._id;
          await Team.findByIdAndUpdate(existingTeam._id, {
            $addToSet: { members: user._id }
          });
        }
      }
    }

    // Notify the user about their role change
    await Alert.create({
      audience: newRole,
      user: user._id,
      kind: 'reminder',
      title: 'Role Update',
      body: `Your role has been updated from ${oldRole} to ${newRole}. Your permissions and portal features have been configured.`
    });
    emitToUser(String(user._id), 'alert:new', { kind: 'reminder' });
  }

  await user.save();
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'user:update', { id: String(user._id) });
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'team:update', {});
  res.json({ ok: true, user: { id: String(user._id), role: user.role, name: user.name } });
}));

// DELETE /api/users/:id
router.delete('/users/:id', requireRole('admin'), ah(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  await User.findByIdAndDelete(req.params.id);
  emitToRoles(['admin'], 'user:update', { id: req.params.id });
  res.json({ ok: true });
}));

// ======================= SETTINGS (admin) =======================

router.get('/settings', requireRole('admin'), ah(async (_req, res) => {
  res.json({ settings: await Setting.get() });
}));

router.put('/settings', requireRole('admin'), ah(async (req, res) => {
  const settings = await Setting.get();
  const allowed = ['workStartHour', 'workEndHour', 'workEndMinute', 'workDays', 'intervalMinutes', 'minWords', 'graceMinutes', 'idleMinutes', 'batchThreshold', 'notifications', 'eodDeadline', 'holidays'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  }
  if (req.body.holidays !== undefined) {
    settings.markModified('holidays');
  }
  await settings.save();
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'setting:update', { holidays: settings.holidays });
  res.json({ settings });
}));

// POST /api/settings/holidays — Admin adds/updates a holiday date or working override
router.post('/settings/holidays', requireRole('admin'), ah(async (req, res) => {
  const { date, name, type, isWorkingOverride } = req.body || {};
  if (!date) return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });

  const settings = await Setting.get();
  settings.holidays = (settings.holidays || []).filter((h) => h.date !== date);
  settings.holidays.push({
    date,
    name: name || 'Holiday',
    type: type || 'org',
    isWorkingOverride: !!isWorkingOverride
  });
  settings.markModified('holidays');
  await settings.save();
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'setting:update', { holidays: settings.holidays });
  res.json({ settings });
}));

// DELETE /api/settings/holidays/:date — Admin removes a holiday entry
router.delete('/settings/holidays/:date', requireRole('admin'), ah(async (req, res) => {
  const settings = await Setting.get();
  settings.holidays = (settings.holidays || []).filter((h) => h.date !== req.params.date);
  settings.markModified('holidays');
  await settings.save();
  emitToRoles(['admin', 'manager', 'leader', 'developer'], 'setting:update', { holidays: settings.holidays });
  res.json({ settings });
}));

// ======================= UPLOAD =======================
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });

router.post('/upload', upload.single('file'), ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = require('@vercel/blob');
      const blob = await put(`devtrack/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return res.json({ url: blob.url, name: req.file.originalname });
    } catch (err) {
      console.error('[upload] Blob failed, saving locally', err.message);
    }
  }
  const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, filename), req.file.buffer);
  res.json({ url: `/uploads/${filename}`, name: req.file.originalname });
}));

module.exports = router;
