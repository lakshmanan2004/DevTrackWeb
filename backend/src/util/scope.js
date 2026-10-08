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
  // developer: own team only
  const team = user.team ? await Team.findById(user.team) : null;
  return {
    teams: team ? [team] : [],
    teamIds: team ? [team._id] : [],
    developerIds: team ? team.members : [],
    projectIds: team && team.project ? [team.project] : []
  };
}

module.exports = { scopeFor };
