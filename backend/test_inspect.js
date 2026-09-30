const mongoose = require('mongoose');
const { User, WorkLog } = require('./src/models');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const laksh = await User.findOne({ name: /Lakshmanan/i });
  console.log('Lakshmanan User:', laksh ? { id: laksh._id, idStr: String(laksh._id), idType: typeof laksh._id, name: laksh.name } : 'null');

  if (laksh) {
    const logs = await WorkLog.find({});
    console.log(`Total WorkLogs in DB: ${logs.length}`);
    logs.forEach(l => {
      const devField = l.developer;
      const devStr = String(l.developer);
      const matches = devStr === String(laksh._id);
      console.log(`Log ID: ${l._id}, date: ${l.date}, devField: ${devField}, devStr: ${devStr}, matchesLaksh: ${matches}`);
    });

    const queryObjId = { developer: laksh._id };
    const logsObjId = await WorkLog.find(queryObjId);
    console.log(`WorkLog.find({ developer: ObjectId("${laksh._id}") }) count: ${logsObjId.length}`);

    const queryStr = { developer: String(laksh._id) };
    const logsStr = await WorkLog.find(queryStr);
    console.log(`WorkLog.find({ developer: String("${laksh._id}") }) count: ${logsStr.length}`);

    const queryOr = { $or: [{ developer: laksh._id }, { developer: String(laksh._id) }] };
    const logsOr = await WorkLog.find(queryOr);
    console.log(`WorkLog.find($or) count: ${logsOr.length}`);
  }

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
