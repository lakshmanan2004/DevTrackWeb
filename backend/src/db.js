const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let memServer = null;

async function dropLegacyIndexes() {
  try {
    if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db.collection('worklogs').dropIndex('developer_1_date_1_hourSlot_1');
      console.log('[db] Successfully dropped legacy unique index developer_1_date_1_hourSlot_1');
    }
  } catch (_err) {
    /* ignore if index was already dropped */
  }
}

async function connectDB() {
  let mode = 'memory';
  const uri = process.env.MONGODB_URI;
  if (uri && !uri.includes('<db_password>')) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
      console.log('[db] Connected to MongoDB Atlas cluster');
      mode = 'atlas';
    } catch (err) {
      console.warn('[db] Could not connect to MongoDB Atlas:', err.message);
      console.warn('[db] Note: If accessing from a new network, whitelist 0.0.0.0/0 in MongoDB Atlas -> Security -> Network Access');
    }
  }

  if (mode === 'memory') {
    // Try local MongoDB service if running
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/devtrack', { serverSelectionTimeoutMS: 1500 });
      console.log('[db] Connected to local MongoDB instance (mongodb://127.0.0.1:27017/devtrack)');
      mode = 'local-mongo';
    } catch {
      /* Fallback to disk-persisted Mongo server */
    }
  }

  if (mode === 'memory') {
    // Local dev fallback: Disk-persisted database so users & data are NOT wiped on server restart
    const dbDir = path.join(__dirname, '..', 'data', 'db');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const { MongoMemoryServer } = require('mongodb-memory-server');
    try {
      memServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbDir,
          storageEngine: 'wiredTiger'
        }
      });
      await mongoose.connect(memServer.getUri('devtrack'));
      console.log(`[db] Local persistent database connected (${dbDir}) — Users & data preserved across restarts`);
      mode = 'persistent-disk';
    } catch (err) {
      memServer = await MongoMemoryServer.create();
      await mongoose.connect(memServer.getUri('devtrack'));
      console.log('[db] In-memory database ready');
      mode = 'memory';
    }
  }

  await dropLegacyIndexes();
  return mode;
}

module.exports = { connectDB, mongoose };
