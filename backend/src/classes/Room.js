class Room {
  constructor({ code, hostId, hostName, settings, io }) {
    this.code = code;
    this.io = io;
    this.hostId = hostId;
    this.hostName = hostName;
    this.settings = settings;
    /** @type {Map<string, import('./Player')>} */
    this.players = new Map();
    this.game = null;
    this.state = 'lobby'; // lobby | playing | ended
  }

  addPlayer(player) {
    this.players.set(player.id, player);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  broadcast(event, payload) {
    this.io.to(this.code).emit(event, payload);
  }

  emitTo(playerId, event, payload) {
    const player = this.players.get(playerId);
    if (player) this.io.to(player.socketId).emit(event, payload);
  }

  publicPlayerList() {
    return [...this.players.values()].map((p) => p.toPublic());
  }

  connectedPlayerCount() {
    return [...this.players.values()].filter((p) => p.connected).length;
  }

  isHost(playerId) {
    return this.hostId === playerId;
  }

  canStart() {
    return this.state === 'lobby' && this.connectedPlayerCount() >= 2;
  }

  isEmpty() {
    return this.connectedPlayerCount() === 0;
  }
}

module.exports = Room;
