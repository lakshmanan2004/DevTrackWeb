// Role-based data scoping: which developers/projects each role may see.
const { Team, Project, User } = require('../models');

async function scopeFor(user) {
  if (user.role === 'admin') {
    const teams = await Team.find().populate('leader', 'name');
    return {
      teams,
      teamIds: teams.map((t) => t._id),
      developerIds: (await User.find({ role: 'developer', active: true })).map((u) => u._id),
      projectIds: (await Project.find()).map((p) => p._id)
    };
  }
  if (user.role === 'leader') {
    const teams = await Team.find({ leader: user._id });
    const ids = teams.map((t) => t._id);
    const devs = teams.flatMap((t) => t.members);
    return { teams, teamIds: ids, developerIds: devs, projectIds: teams.map((t) => t.project).filter(Boolean) };
  }
  if (user.role === 'manager') {
    const projects = await Project.find({ manager: user._id }).populate('team');
    const teams = projects.map((p) => p.team).filter(Boolean);
    const ids = teams.map((t) => t._id);
    const devs = teams.flatMap((t) => t.members);
    return { teams, teamIds: ids, developerIds: devs, projectIds: projects.map((p) => p._id) };
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
