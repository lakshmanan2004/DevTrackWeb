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
    const teams = await Team.find({
      $or: [
        { leader: user._id },
        { leader: String(user._id) },
        ...(user.team ? [{ _id: user.team }] : [])
      ]
    });
    const ids = teams.map((t) => t._id);
    const devsFromTeam = teams.flatMap((t) => t.members || []);
    const devsWithTeamDoc = await User.find({ role: 'developer', active: { $ne: false }, team: { $in: ids } });
    const devIdsSet = new Set([
      ...devsFromTeam.map((d) => String(d._id || d)),
      ...devsWithTeamDoc.map((d) => String(d._id))
    ]);
    let developerIds = Array.from(devIdsSet);
    if (!developerIds.length) {
      const allDevs = await User.find({ role: 'developer', active: { $ne: false } }, '_id');
      developerIds = allDevs.map((d) => String(d._id));
    }
    return { teams, teamIds: ids, developerIds, projectIds: teams.map((t) => t.project).filter(Boolean) };
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
