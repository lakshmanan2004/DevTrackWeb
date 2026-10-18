const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '2mb' }));

// CORS: allow the Vercel frontend (set CLIENT_ORIGIN) and localhost dev servers
const cors = require('cors');
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(',')
      : true,
    credentials: false
  })
);

app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') console.log(req.method, req.url);
  next();
});

// local uploads fallback (used when BLOB_READ_WRITE_TOKEN is not configured)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'DevTrack Backend is running', time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/commits', require('./routes/commits'));
app.use('/api/eod', require('./routes/eod'));
app.use('/api/developers', require('./routes/developers'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api', require('./routes/org'));
app.use('/api', require('./routes/reports'));

// Production SPA static file serving (resolves 404 on direct URL navigation & refresh)
const distPath = path.join(__dirname, '..', '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
