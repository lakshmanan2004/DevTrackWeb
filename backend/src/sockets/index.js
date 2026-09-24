const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { User } = require('../models');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: false },
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user || !user.active) return next(new Error('unauthorized'));
      socket.data.userId = String(user._id);
      socket.data.role = user.role;
      socket.data.teamId = user.team ? String(user.team) : null;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role, teamId } = socket.data;
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);
    if (teamId) socket.join(`team:${teamId}`);

    // Developers heartbeat every 30s; leaders/managers see live presence.
    socket.on('presence:heartbeat', async () => {
      if (role !== 'developer') return;
      const now = new Date();
      const user = await User.findById(userId);
      if (!user) return;
      const prev = user.lastSeenAt ? user.lastSeenAt.getTime() : 0;
      if (now.getTime() - prev > 15000) {
        user.lastSeenAt = now;
        await user.save();
        const payload = { userId, lastSeenAt: now.toISOString() };
        if (teamId) io.to(`team:${teamId}`).emit('presence:update', payload);
        io.to(`role:leader`).to(`role:manager`).to(`role:admin`).emit('presence:update', payload);
      }
    });
  });

  console.log('[socket] Socket.IO ready');
  return io;
}

function emitToRoles(roles, event, payload) {
  if (!io) return;
  for (const role of roles) io.to(`role:${role}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function emitToTeam(teamId, event, payload) {
  if (!io) return;
  io.to(`team:${teamId}`).emit(event, payload);
}

module.exports = { initSocket, emitToRoles, emitToUser, emitToTeam, getIO: () => io };
