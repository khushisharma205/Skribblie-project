let counter = 0;

class Player {
  constructor({ id, socketId, name, userId = null }) {
    this.id = id;
    this.socketId = socketId;
    this.userId = userId;
    this.name = name;
    this.score = 0;
    this.isDrawing = false;
    this.hasGuessedCorrectly = false;
    this.connected = true;
    this.isHost = false;
    this._seq = counter += 1;
  }

  resetRoundState() {
    this.isDrawing = false;
    this.hasGuessedCorrectly = false;
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isDrawing: this.isDrawing,
      hasGuessedCorrectly: this.hasGuessedCorrectly,
      connected: this.connected,
      isHost: this.isHost,
    };
  }
}

module.exports = Player;
