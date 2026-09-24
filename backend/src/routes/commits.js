const express = require('express');
const { Commit, Project } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { commitDto } = require('../util/dto');
const { scopeFor } = require('../util/scope');
const { dayStr, addDays } = require('../util/time');
const { emitToRoles } = require('../sockets');

const router = express.Router();
router.use(authRequired, attachUser);

async function parseGitHubCommitUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]+)/i);
  if (!match) return null;
  const [, owner, repo, sha] = match;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
      headers: { 'User-Agent': 'DevTrack-App', Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) return { sha: sha.slice(0, 7) };
    const data = await res.json();
    return {
      sha: data.sha ? data.sha.slice(0, 7) : sha.slice(0, 7),
      message: data.commit?.message?.split('\n')[0] || '',
      committedAt: data.commit?.author?.date || data.commit?.committer?.date || null,
      files: data.files ? data.files.length : (data.stats?.total || 1)
    };
  } catch (e) {
    return { sha: sha.slice(0, 7) };
  }
}

// GET /api/commits/fetch-github?url=
router.get('/fetch-github', ah(async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'GitHub commit URL is required' });
  const meta = await parseGitHubCommitUrl(String(url));
  if (!meta) return res.status(400).json({ error: 'Invalid GitHub commit URL format' });
  res.json({ meta });
}));

// GET /api/commits?scope=me|team&date=
router.get('/', ah(async (req, res) => {
  const today = req.query.date || dayStr();
  const yesterday = dayStr(addDays(new Date(`${today}T12:00:00`), -1));
  const scope = await scopeFor(req.user);
  const teamCommitIds = scope.developerIds.map((d) => String(d));

  const mineToday = await Commit.find({ developer: req.user._id, date: today }).sort({ committedAt: -1 });
  const mineYesterday = await Commit.find({ developer: req.user._id, date: yesterday }).sort({ committedAt: -1 });

  const teamQuery = { date: today };
  if (req.user.role !== 'admin') teamQuery.developer = { $in: teamCommitIds };
  const teamToday = await Commit.find(teamQuery)
    .sort({ committedAt: -1 })
    .populate('developer', 'name initials')
    .populate('project', 'name');

  const dto = (c, withDev) => commitDto(c, withDev ? { devName: c.developer?.name, initials: c.developer?.initials } : {});

  res.json({
    today: mineToday.map((c) => dto(c, false)),
    yesterday: mineYesterday.map((c) => dto(c, false)),
    team: teamToday.map((c) => dto(c, true))
  });
}));

// POST /api/commits — developer logs a commit (supports URL auto-parsing & custom timestamp)
router.post('/', ah(async (req, res) => {
  let { message, branch, files, url, committedAt, projectId } = req.body || {};
  let githubMeta = null;

  if (url && url.includes('github.com')) {
    githubMeta = await parseGitHubCommitUrl(url);
    if (githubMeta) {
      if (!message && githubMeta.message) message = githubMeta.message;
      if (githubMeta.committedAt && !committedAt) committedAt = githubMeta.committedAt;
      if (githubMeta.files && !req.body.files) files = githubMeta.files;
    }
  }

  if (!message || !message.trim()) return res.status(400).json({ error: 'Commit message is required' });

  const sha = (githubMeta && githubMeta.sha)
    ? githubMeta.sha
    : (url && url.includes('/commit/'))
    ? url.split('/commit/')[1].slice(0, 7)
    : Math.random().toString(16).slice(2, 9);

  const commitTime = committedAt ? new Date(committedAt) : new Date();
  const commitDateStr = dayStr(commitTime);

  const project = projectId
    ? await Project.findById(projectId)
    : req.user.team ? await Project.findOne({ team: req.user.team }) : null;

  const commit = await Commit.create({
    developer: req.user._id,
    team: req.user.team,
    project: project ? project._id : undefined,
    message: message.trim(),
    branch: branch || 'main',
    files: Number(files) || 1,
    sha,
    url: url || '',
    committedAt: commitTime,
    date: commitDateStr
  });

  const dto = commitDto(commit, { devName: req.user.name, initials: req.user.initials });
  emitToRoles(['leader', 'manager', 'admin'], 'commit:new', { ...dto, developerId: String(req.user._id) });
  res.status(201).json({ commit: dto });
}));

module.exports = router;
