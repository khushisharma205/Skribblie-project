const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[db] MONGODB_URI not set - running without persistence (word list will use local JSON fallback, auth/history disabled).');
    return false;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('[db] MongoDB connected');
    return true;
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    console.warn('[db] Continuing without persistence.');
    return false;
  }
}

function isDbConnected() {
  return isConnected;
}

module.exports = { connectDB, isDbConnected };
