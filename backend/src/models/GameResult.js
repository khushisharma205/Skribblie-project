const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    players: [
      {
        name: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        score: Number,
      },
    ],
    winner: { type: String, default: null },
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameResult', gameResultSchema);
