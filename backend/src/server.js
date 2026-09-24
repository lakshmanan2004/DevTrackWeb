require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./db');
const { seedIfEmpty } = require('./seed');
const { initSocket } = require('./sockets');
const jobs = require('./jobs/detect');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  await seedIfEmpty();
  const server = http.createServer(app);
  initSocket(server);
  jobs.start();
  server.listen(PORT, () => {
    console.log(`DevTrack API running on http://localhost:${PORT}`);
  });
})().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
