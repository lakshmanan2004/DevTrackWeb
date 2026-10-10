// Role-based data scoping: which developers/projects each role may see.
const { Team, Project, User } = require('../models');

async function scopeFor(user) {
  if (user.role === 'admin') {
    const teams = await Team.find().populate('leader', 'name');
    return {
      teams,
      teamIds: teams.map((t) => t._id),
      developerIds: (await User.find({ role: 'developer', active: { $ne: false } })).map((u) => u._id),
      projectIds: (await Project.find()).map((p) => p._id)
    };
  }
  if (user.role === 'leader') {
    // Find all teams where this user is the assigned leader, or user belongs to that team
    const teams = await Team.find({
      $or: [
        { leader: user._id },
        { leader: String(user._id) },
        ...(user.team ? [{ _id: user.team }] : [])
      ]
    });
    const ids = teams.map((t) => t._id);

    // Also find projects where this leader is assigned
    const projects = await Project.find({
      $or: [
        { leader: user.name },
        { leader: user._id },
        { leader: String(user._id) },
        { team: { $in: ids } }
      ]
    });
    const projectIds = projects.map((p) => p._id);
    const projectTeamIds = projects.map((p) => p.team).filter(Boolean);
    const allTeamIds = Array.from(new Set([...ids.map((id) => String(id)), ...projectTeamIds.map((id) => String(id))]));

    // Find all developers assigned to these specific teams
    const devsFromTeam = teams.flatMap((t) => t.members || []);
    const devsWithTeamDoc = await User.find({ role: 'developer', active: { $ne: false }, team: { $in: allTeamIds } });
    
    // Also check developers listed in projects if stored as array of IDs
    const devsFromProjects = projects.flatMap((p) => (Array.isArray(p.developers) ? p.developers : []));

    const devIdsSet = new Set([
      ...devsFromTeam.map((d) => String(d._id || d)),
      ...devsWithTeamDoc.map((d) => String(d._id)),
      ...devsFromProjects.map((d) => String(d._id || d)).filter((id) => id && id.length === 24)
    ]);
    
    const developerIds = Array.from(devIdsSet);

    // STRICT: Only return developers allotted to this leader's teams/projects. Never fall back to allDevs.
    return { teams, teamIds: allTeamIds, developerIds, projectIds };
  }
  if (user.role === 'manager') {
    const projects = await Project.find({ manager: user._id }).populate('team');
    const teams = projects.map((p) => p.team).filter(Boolean);
    const ids = teams.map((t) => t._id);
    const devsFromTeam = teams.flatMap((t) => t.members || []);
    const devsWithTeamDoc = await User.find({ role: 'developer', active: { $ne: false }, team: { $in: ids } });
    const devIdsSet = new Set([
      ...devsFromTeam.map((d) => String(d._id || d)),
      ...devsWithTeamDoc.map((d) => String(d._id))
    ]);
    const developerIds = Array.from(devIdsSet);
    return { teams, teamIds: ids, developerIds, projectIds: projects.map((p) => p._id) };
  }
  // developer: STRICT single project allocation rule.
  // Find all teams where user was added, prioritize the active ongoing project team,
  // and auto-clean duplicate memberships from other teams.
  const allTeams = await Team.find({
    $or: [
      { members: user._id },
      { members: String(user._id) },
      { leader: user._id },
      { leader: String(user._id) },
      ...(user.team ? [{ _id: user.team }] : [])
    ]
  }).populate('project');

  let primaryTeam = null;
  let primaryProject = null;

  if (allTeams.length > 0) {
    // 1. Prefer ongoing/active project team
    for (const t of allTeams) {
      if (t.project && t.project.status === 'ongoing') {
        primaryTeam = t;
        primaryProject = t.project;
        break;
      }
    }
    // 2. Otherwise prefer user.team
    if (!primaryTeam && user.team) {
      primaryTeam = allTeams.find((t) => String(t._id) === String(user.team));
      if (primaryTeam) primaryProject = primaryTeam.project;
    }
    // 3. Fallback to latest team
    if (!primaryTeam) {
      primaryTeam = allTeams[allTeams.length - 1];
      if (primaryTeam) primaryProject = primaryTeam.project;
    }

    // Single-project enforcement: if developer is in multiple teams, remove from all other teams
    if (primaryTeam && allTeams.length > 1) {
      const otherTeamIds = allTeams.filter((t) => String(t._id) !== String(primaryTeam._id)).map((t) => t._id);
      if (otherTeamIds.length > 0) {
        Team.updateMany(
          { _id: { $in: otherTeamIds } },
          { $pull: { members: user._id } }
        ).exec().catch(() => {});
      }
      if (String(user.team) !== String(primaryTeam._id)) {
        User.findByIdAndUpdate(user._id, { team: primaryTeam._id }).exec().catch(() => {});
      }
    }
  }

  if (!primaryProject && primaryTeam) {
    primaryProject = await Project.findOne({ team: primaryTeam._id });
  }

  const teams = primaryTeam ? [primaryTeam] : [];
  const teamIds = primaryTeam ? [primaryTeam._id] : [];
  const projectIds = primaryProject ? [primaryProject._id] : [];
  const developerIds = primaryTeam && primaryTeam.members ? primaryTeam.members : [user._id];

  return {
    teams,
    teamIds,
    developerIds,
    projectIds
  };
}

module.exports = { scopeFor };
