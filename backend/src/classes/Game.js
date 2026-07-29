const { getRandomWords } = require('../utils/wordBank');
const { matchGuess, normalize } = require('../utils/wordMatch');
const { calculateGuesserScore, calculateDrawerScore } = require('../utils/scoring');
const GameResult = require('../models/GameResult');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

const CHOOSE_TIME_MS = 15000;
const ROUND_END_DELAY_MS = 5000;

class Game {
  constructor(room) {
    this.room = room;
    this.round = 0;
    this.totalRounds = room.settings.rounds;
    this.drawOrder = [];
    this.drawerIndex = -1;
    this.currentWord = null;
    this.wordOptions = [];
    this.usedWords = new Set();
    this.revealed = [];
    this.correctGuessers = [];
    this.phase = 'lobby'; // choosing | drawing | round_end | game_over
    this.drawTimer = null;
    this.hintTimer = null;
    this.chooseTimer = null;
    this.roundEndTimer = null;
    this.roundStartAt = null;
  }

  get currentDrawer() {
    const id = this.drawOrder[this.drawerIndex];
    return id ? this.room.getPlayer(id) : null;
  }

  clearTimers() {
    clearTimeout(this.drawTimer);
    clearInterval(this.hintTimer);
    clearTimeout(this.chooseTimer);
    clearTimeout(this.roundEndTimer);
  }

  start() {
    this.drawOrder = [...this.room.players.keys()];
    this.round = 0;
    this.drawerIndex = -1;
    this.room.state = 'playing';
    this.nextTurn();
  }

  /** Advances to the next drawer, or ends the game if all rounds are complete. */
  nextTurn() {
    this.clearTimers();

    for (const player of this.room.players.values()) player.resetRoundState();

    let attempts = 0;
    let drawer = null;
    while (attempts < this.drawOrder.length) {
      this.drawerIndex += 1;
      if (this.drawerIndex >= this.drawOrder.length) {
        this.drawerIndex = 0;
        this.round += 1;
      }
      if (this.round === 0) this.round = 1;

      const candidate = this.room.getPlayer(this.drawOrder[this.drawerIndex]);
      attempts += 1;
      if (candidate && candidate.connected) {
        drawer = candidate;
        break;
      }
    }

    if (this.round > this.totalRounds || !drawer) {
      return this.endGame();
    }

    drawer.isDrawing = true;
    this.currentWord = null;
    this.correctGuessers = [];
    this.phase = 'choosing';
    this.wordOptions = getRandomWords(this.room.settings.wordCount, this.usedWords);

    this.room.broadcast('round_start', {
      drawerId: drawer.id,
      drawerName: drawer.name,
      round: this.round,
      totalRounds: this.totalRounds,
      drawTime: this.room.settings.drawTime,
      wordOptions: null,
    });
    this.room.emitTo(drawer.id, 'word_choices', {
      options: this.wordOptions,
      chooseTime: CHOOSE_TIME_MS / 1000,
    });

    this.broadcastState();

    this.chooseTimer = setTimeout(() => {
      if (this.phase === 'choosing') {
        this.chooseWord(this.wordOptions[0]);
      }
    }, CHOOSE_TIME_MS);

    return null;
  }

  chooseWord(word) {
    if (this.phase !== 'choosing') return false;
    const normalized = normalize(word);
    if (!this.wordOptions.map(normalize).includes(normalized)) return false;

    clearTimeout(this.chooseTimer);
    this.currentWord = normalized;
    this.usedWords.add(normalized);
    this.revealed = normalized.split('').map((ch) => ch === ' ');
    this.phase = 'drawing';
    this.roundStartAt = Date.now();

    this.room.emitTo(this.currentDrawer.id, 'game_state', this.stateFor(this.currentDrawer.id));
    this.broadcastState();

    this.drawTimer = setTimeout(() => this.endRound('time_up'), this.room.settings.drawTime * 1000);
    this.scheduleHints();
    return true;
  }

  scheduleHints() {
    const hintCount = this.room.settings.hints;
    if (!hintCount || hintCount <= 0) return;

    const drawTimeMs = this.room.settings.drawTime * 1000;
    const interval = drawTimeMs / (hintCount + 1);
    let revealedSoFar = 0;

    this.hintTimer = setInterval(() => {
      revealedSoFar += 1;
      const unrevealedIndices = this.revealed
        .map((r, idx) => (r ? -1 : idx))
        .filter((idx) => idx !== -1);

      if (unrevealedIndices.length > 0) {
        const pick = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        this.revealed[pick] = true;
        this.broadcastState();
      }

      if (revealedSoFar >= hintCount || unrevealedIndices.length <= 1) {
        clearInterval(this.hintTimer);
      }
    }, interval);
  }

  maskedWord() {
    if (!this.currentWord) return '';
    return this.currentWord
      .split('')
      .map((ch, idx) => (this.revealed[idx] ? ch : (ch === ' ' ? ' ' : '_')))
      .join('');
  }

  /** Builds the game_state payload. Drawer gets the real word; others get the masked version. */
  stateFor(playerId) {
    const drawer = this.currentDrawer;
    const isDrawer = drawer && drawer.id === playerId;
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.totalRounds,
      drawerId: drawer ? drawer.id : null,
      drawerName: drawer ? drawer.name : null,
      word: isDrawer ? this.currentWord : this.maskedWord(),
      wordLength: this.currentWord ? this.currentWord.length : 0,
      drawTime: this.room.settings.drawTime,
      scores: this.room.publicPlayerList(),
    };
  }

  /** Sends a personalized game_state to every player (drawer sees the real word). */
  broadcastState() {
    for (const player of this.room.players.values()) {
      if (!player.connected) continue;
      this.room.emitTo(player.id, 'game_state', this.stateFor(player.id));
    }
  }

  /**
   * Handles a guess from a player. Returns 'correct' | 'close' | 'incorrect' | null (not applicable).
   */
  checkGuess(playerId, text) {
    if (this.phase !== 'drawing' || !this.currentWord) return null;
    const player = this.room.getPlayer(playerId);
    if (!player || player.isDrawing) return null;

    if (player.hasGuessedCorrectly) {
      this.room.broadcast('chat_message', {
        playerId: player.id,
        playerName: player.name,
        text,
        type: 'chat',
      });
      return null;
    }

    const result = matchGuess(text, this.currentWord);

    if (result === 'correct') {
      player.hasGuessedCorrectly = true;
      const order = this.correctGuessers.length;
      this.correctGuessers.push(playerId);

      const timeLeftMs = Math.max(0, this.roundStartAt + this.room.settings.drawTime * 1000 - Date.now());
      const points = calculateGuesserScore(timeLeftMs, this.room.settings.drawTime * 1000, order);
      player.score += points;

      this.room.broadcast('guess_result', {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points,
      });
      this.room.broadcast('chat_message', {
        playerId: 'system',
        playerName: 'System',
        text: `${player.name} guessed the word!`,
        type: 'system',
      });
      this.broadcastState();

      const eligible = [...this.room.players.values()].filter((p) => p.connected && !p.isDrawing);
      if (eligible.length > 0 && eligible.every((p) => p.hasGuessedCorrectly)) {
        this.endRound('all_guessed');
      }
      return 'correct';
    }

    if (result === 'close') {
      this.room.emitTo(playerId, 'guess_result', {
        correct: false,
        close: true,
        playerId: player.id,
        playerName: player.name,
      });
      return 'close';
    }

    this.room.broadcast('chat_message', {
      playerId: player.id,
      playerName: player.name,
      text,
      type: 'guess',
    });
    return 'incorrect';
  }

  endRound(reason) {
    this.clearTimers();
    this.phase = 'round_end';

    const drawer = this.currentDrawer;
    if (drawer) {
      const eligible = [...this.room.players.values()].filter((p) => p.connected && !p.isDrawing);
      const drawerPoints = calculateDrawerScore(this.correctGuessers.length, eligible.length);
      drawer.score += drawerPoints;
    }

    this.room.broadcast('round_end', {
      word: this.currentWord,
      reason,
      scores: this.room.publicPlayerList(),
      nextRound: this.round < this.totalRounds || this.drawerIndex < this.drawOrder.length - 1,
    });

    this.roundEndTimer = setTimeout(() => this.nextTurn(), ROUND_END_DELAY_MS);
  }

  async endGame() {
    this.clearTimers();
    this.phase = 'game_over';
    this.room.state = 'ended';

    const leaderboard = this.room
      .publicPlayerList()
      .sort((a, b) => b.score - a.score);
    const winner = leaderboard.length > 0 ? leaderboard[0].name : null;

    this.room.broadcast('game_over', { winner, leaderboard });

    if (isDbConnected()) {
      try {
        await GameResult.create({
          roomCode: this.room.code,
          players: leaderboard.map((p) => ({ name: p.name, score: p.score })),
          winner,
        });

        for (const player of this.room.players.values()) {
          if (!player.userId) continue;
          const isWinner = player.name === winner;
          await User.findByIdAndUpdate(player.userId, {
            $inc: {
              'stats.gamesPlayed': 1,
              'stats.wins': isWinner ? 1 : 0,
              'stats.totalScore': player.score,
            },
          });
        }
      } catch (err) {
        console.error('[game] failed to persist game results:', err.message);
      }
    }
  }
}

module.exports = Game;
