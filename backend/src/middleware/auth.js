const jwt = require('jsonwebtoken');
const { User, Team, Project } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'devtrack-dev-secret-change-me';

function sign(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    });
  }
  return list;
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  let token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    const cookies = parseCookies(req);
    token = cookies.devtrack_token || cookies.token || null;
  }
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

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { JWT_SECRET, sign, authRequired, attachUser, requireRole, ah, parseCookies };
