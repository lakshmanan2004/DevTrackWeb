const { WorkLog } = require('./src/models');
const { workLogDto } = require('./src/util/dto');
const mongoose = require('mongoose');

async function test() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devtrack';
  await mongoose.connect(MONGODB_URI);
  const logs = await WorkLog.find().sort({ _id: -1 }).limit(5);
  console.log("Raw logs count:", logs.length);
  for (const log of logs) {
    const dto = workLogDto(log);
    console.log("LOG:", {
      id: log._id,
      hourSlot: log.hourSlot,
      submittedAt: log.submittedAt,
      isLate_raw: log.isLate,
      dto_isLate: dto.isLate,
      dto_submissionStatus: dto.submissionStatus
    });
  }
  await mongoose.disconnect();
}
test().catch(console.error);
