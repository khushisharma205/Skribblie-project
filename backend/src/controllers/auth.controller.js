const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { isDbConnected } = require('../config/db');

function requireDb(res) {
  if (!isDbConnected()) {
    res.status(503).json({ error: 'Accounts are unavailable right now (database not connected). You can still play as a guest.' });
    return false;
  }
  return true;
}

async function register(req, res) {
  if (!requireDb(res)) return;
  const { username, password } = req.body;

  if (!username || !password || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Username must be 3+ chars and password 6+ chars.' });
  }

  try {
    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.trim(), passwordHash });
    const token = signToken({ userId: user._id, username: user.username });

    return res.status(201).json({
      token,
      user: { id: user._id, username: user.username, stats: user.stats },
    });
  } catch (err) {
  console.error("REGISTER ERROR:", err);
  return res.status(500).json({
    error: "Registration failed.",
    message: err.message
  });
}
}

async function login(req, res) {
  if (!requireDb(res)) return;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = signToken({ userId: user._id, username: user.username });
    return res.json({
      token,
      user: { id: user._id, username: user.username, stats: user.stats },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed.' });
  }
}

async function me(req, res) {
  if (!requireDb(res)) return;
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: { id: user._id, username: user.username, stats: user.stats } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
}

module.exports = { register, login, me };
