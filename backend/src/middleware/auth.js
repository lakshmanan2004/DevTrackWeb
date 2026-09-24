const jwt = require('jsonwebtoken');
const { User, Team, Project } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'devtrack-dev-secret-change-me';

function sign(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

async function attachUser(req, res, next) {
  try {
    req.user = await User.findById(req.userId).populate('team');
    if (!req.user || !req.user.active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission for this action' });
    }
    next();
  };
}

// Wrap async route handlers so thrown errors reach the error middleware.
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { JWT_SECRET, sign, authRequired, attachUser, requireRole, ah };
