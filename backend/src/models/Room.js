const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    hostName: { type: String, required: true },
    settings: {
      maxPlayers: { type: Number, default: 8 },
      rounds: { type: Number, default: 3 },
      drawTime: { type: Number, default: 80 },
      wordCount: { type: Number, default: 3 },
      hints: { type: Number, default: 2 },
      isPrivate: { type: Boolean, default: false },
    },
    status: { type: String, enum: ['lobby', 'playing', 'ended'], default: 'lobby' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
