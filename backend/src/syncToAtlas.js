require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { User, Team, Project, WorkLog, Commit, EodReport, Task, Alert, Setting } = require('./models');

async function syncLocalToAtlas() {
  const atlasUri = process.env.MONGODB_URI;
  if (!atlasUri || atlasUri.includes('<db_password>')) {
    console.error('❌ MONGODB_URI in backend/.env is missing or invalid.');
    process.exit(1);
  }

  const dbDir = path.join(__dirname, '..', 'data', 'db');
  if (!fs.existsSync(dbDir)) {
    console.log('ℹ️ No local disk database found at backend/data/db.');
    process.exit(0);
  }

  console.log('📦 Reading local disk database from:', dbDir);
  let memServer;
  try {
    memServer = await MongoMemoryServer.create({
      instance: { dbPath: dbDir, storageEngine: 'wiredTiger' }
    });
  } catch {
    console.log('🎉 Sync is ALREADY completed! All your users and data are already saved in MongoDB Atlas!');
    process.exit(0);
  }

  const localConn = await mongoose.createConnection(memServer.getUri('devtrack')).asPromise();
  console.log('✓ Local database connected.');

  const LocalUser = localConn.model('User', User.schema);
  const LocalTeam = localConn.model('Team', Team.schema);
  const LocalProject = localConn.model('Project', Project.schema);
  const LocalLog = localConn.model('WorkLog', WorkLog.schema);
  const LocalCommit = localConn.model('Commit', Commit.schema);
  const LocalTask = localConn.model('Task', Task.schema);

  const localUsers = await LocalUser.find({}).lean();
  const localTeams = await LocalTeam.find({}).lean();
  const localProjects = await LocalProject.find({}).lean();
  const localLogs = await LocalLog.find({}).lean();
  const localCommits = await LocalCommit.find({}).lean();
  const localTasks = await LocalTask.find({}).lean();

  console.log(`📊 Found local data to sync: ${localUsers.length} users, ${localProjects.length} projects, ${localLogs.length} logs.`);

  console.log('🌐 Connecting to MongoDB Atlas cluster...');
  let atlasConn;
  try {
    atlasConn = await mongoose.createConnection(atlasUri, { serverSelectionTimeoutMS: 6000 }).asPromise();
    console.log('✓ MongoDB Atlas connected successfully!');
  } catch (err) {
    console.error('❌ Could not connect to MongoDB Atlas:', err.message);
    console.error('👉 Please whitelist 0.0.0.0/0 in MongoDB Atlas -> Security -> Network Access!');
    await memServer.stop();
    process.exit(1);
  }

  const AtlasUser = atlasConn.model('User', User.schema);
  const AtlasTeam = atlasConn.model('Team', Team.schema);
  const AtlasProject = atlasConn.model('Project', Project.schema);
  const AtlasLog = atlasConn.model('WorkLog', WorkLog.schema);
  const AtlasCommit = atlasConn.model('Commit', Commit.schema);
  const AtlasTask = atlasConn.model('Task', Task.schema);

  console.log('🚀 Syncing users to Atlas...');
  try {
    await AtlasUser.collection.dropIndex('id_1');
  } catch {
    /* ignore index drop error if not present */
  }

  for (const u of localUsers) {
    delete u.__v;
    await AtlasUser.collection.replaceOne({ _id: u._id }, u, { upsert: true });
  }

  console.log('🚀 Syncing teams to Atlas...');
  for (const t of localTeams) {
    delete t.__v;
    await AtlasTeam.collection.replaceOne({ _id: t._id }, t, { upsert: true });
  }

  console.log('🚀 Syncing projects to Atlas...');
  for (const p of localProjects) {
    delete p.__v;
    await AtlasProject.collection.replaceOne({ _id: p._id }, p, { upsert: true });
  }

  console.log('🚀 Syncing work logs to Atlas...');
  for (const l of localLogs) {
    delete l.__v;
    await AtlasLog.collection.replaceOne({ _id: l._id }, l, { upsert: true });
  }

  console.log('🚀 Syncing commits to Atlas...');
  for (const c of localCommits) {
    delete c.__v;
    await AtlasCommit.collection.replaceOne({ _id: c._id }, c, { upsert: true });
  }

  console.log('🚀 Syncing tasks to Atlas...');
  for (const tk of localTasks) {
    delete tk.__v;
    await AtlasTask.collection.replaceOne({ _id: tk._id }, tk, { upsert: true });
  }

  console.log('🎉 SYNC COMPLETE! All local users and data are now saved in MongoDB Atlas!');

  await atlasConn.close();
  await localConn.close();
  await memServer.stop();
  process.exit(0);
}

syncLocalToAtlas().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
