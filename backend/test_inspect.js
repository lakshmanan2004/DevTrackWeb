const mongoose = require('mongoose');
const { User, Team, WorkLog, Project } = require('./src/models');
const { scopeFor } = require('./src/util/scope');
require('dotenv').config();

const toObjId = (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const leaders = await User.find({ role: 'leader' });
  console.log('Leaders in DB:', leaders.map(l => l.name));

  for (const leader of leaders) {
    const scope = await scopeFor(leader);
    console.log(`\n--- Leader: ${leader.name} (${leader._id}) ---`);
    console.log('Team IDs:', scope.teamIds);
    console.log('Developer IDs:', scope.developerIds);

    const devObjectIds = (scope.developerIds || []).map(toObjId);
    const teamObjectIds = (scope.teamIds || []).map(toObjId);
    const projObjectIds = (scope.projectIds || []).map(toObjId);

    const conditions = [];
    if (devObjectIds.length) conditions.push({ developer: { $in: devObjectIds } });
    if (teamObjectIds.length) conditions.push({ team: { $in: teamObjectIds } });
    if (projObjectIds.length) conditions.push({ project: { $in: projObjectIds } });
    const query = conditions.length ? { $or: conditions } : {};

    const logs = await WorkLog.find(query).sort({ date: -1, hourSlot: -1 });
    console.log(`Found ${logs.length} logs for leader ${leader.name}`);
    logs.forEach(l => console.log(`  - Log ID: ${l._id}, Date: ${l.date}, Task: ${l.task}, Review: ${l.review}`));
  }

  const developers = await User.find({ role: 'developer' });
  for (const dev of developers) {
    console.log(`\n--- Developer: ${dev.name} (${dev._id}) ---`);
    const logs = await WorkLog.find({ developer: dev._id }).sort({ date: -1, hourSlot: -1 });
    console.log(`Found ${logs.length} logs for dev ${dev.name}`);
    logs.forEach(l => console.log(`  - Log ID: ${l._id}, Date: ${l.date}, Task: ${l.task}, Review: ${l.review}`));
  }

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
