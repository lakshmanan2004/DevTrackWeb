/* Seeds the database on first start.
   Only ONE bootstrap admin account is created — every other user must be
   added by the admin in User Management (email + temporary password + role).
   Teams, projects and all work data grow from real usage. */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, Team, Project, WorkLog, Commit, EodReport, Task, Alert, Setting } = require('./models');

const ADMIN_EMAIL = 'admin@college.edu';
const ADMIN_PASSWORD = 'devtrack@2026';

async function seedIfEmpty() {
  const count = await User.estimatedDocumentCount();
  if (count > 0) {
    console.log('[seed] Database already has users, skipping seed');
    return false;
  }
  await Promise.all([
    User.deleteMany({}), Team.deleteMany({}), Project.deleteMany({}),
    WorkLog.deleteMany({}), Commit.deleteMany({}), EodReport.deleteMany({}),
    Task.deleteMany({}), Alert.deleteMany({}), Setting.deleteMany({})
  ]);
  await Setting.create({});
  await User.create({
    name: 'Admin User',
    email: ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    role: 'admin',
    initials: 'AD',
    jobTitle: 'Admin'
  });
  console.log(`[seed] Bootstrap admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('[seed] Add all other users from Admin → User Management');
  return true;
}

async function seed() {
  return seedIfEmpty();
}

if (require.main === module) {
  require('dotenv').config();
  const { connectDB } = require('./db');
  (async () => {
    await connectDB();
    await seedIfEmpty();
    process.exit(0);
  })();
}

module.exports = { seedIfEmpty, seed };
