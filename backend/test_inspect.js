const mongoose = require('mongoose');
const { User, Team, WorkLog, Project } = require('./src/models');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const subash = await User.findOne({ name: /Subash/i });
  console.log('Subash User:', subash ? { id: subash._id, name: subash.name, role: subash.role, team: subash.team } : 'null');
  
  if (subash) {
    const teams = await Team.find({ leader: subash._id });
    console.log('Teams led by Subash:', teams);
    const teamIds = teams.map(t => t._id);
    const teamMembers = teams.flatMap(t => t.members);

    const devsWithTeam = await User.find({ team: { $in: teamIds } });
    console.log('Devs with team set to Subash team:', devsWithTeam.map(d => ({ id: d._id, name: d.name })));

    const logsByDev = await WorkLog.find({ developer: { $in: teamMembers } });
    console.log('Logs matching team.members:', logsByDev.length);

    const logsByTeam = await WorkLog.find({ team: { $in: teamIds } });
    console.log('Logs matching team ObjectId:', logsByTeam.length);

    const allLogs = await WorkLog.find({});
    console.log('Total WorkLogs in database:', allLogs.length);
    console.log('All WorkLogs:', allLogs.map(l => ({ id: l._id, dev: l.developer, team: l.team, proj: l.project, date: l.date, task: l.task, review: l.review })));
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
