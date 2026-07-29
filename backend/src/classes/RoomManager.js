const { customAlphabet } = require('nanoid');
const Room = require('./Room');
const Player = require('./Player');
const RoomModel = require('../models/Room');
const { isDbConnected } = require('../config/db');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = customAlphabet(CODE_ALPHABET, 6);

class RoomManager {
  constructor(io) {
    this.io = io;
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  _uniqueCode() {
    let code;
    do {
      code = generateCode();
    } while (this.rooms.has(code));
    return code;
  }

  createRoom({ hostName, settings, socketId }) {
    const code = this._uniqueCode();
    const room = new Room({ code, hostId: socketId, hostName, settings, io: this.io });

    const host = new Player({ id: socketId, socketId, name: hostName });
    host.isHost = true;
    room.addPlayer(host);

    this.rooms.set(code, room);

    if (isDbConnected()) {
      RoomModel.create({ code, hostName, settings }).catch((err) => {
        console.error('[roomManager] failed to persist room:', err.message);
      });
    }

    return { room, player: host };
  }

  joinRoom({ code, playerName, socketId }) {
    const room = this.rooms.get((code || '').toUpperCase());
    if (!room) return { error: 'Room not found.' };
    if (room.state !== 'lobby') return { error: 'Game already in progress.' };
    if (room.connectedPlayerCount() >= room.settings.maxPlayers) return { error: 'Room is full.' };

    const player = new Player({ id: socketId, socketId, name: playerName });
    room.addPlayer(player);
    return { room, player };
  }

  getRoom(code) {
    return this.rooms.get((code || '').toUpperCase());
  }

  findRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return null;
  }

  removeRoom(code) {
    this.rooms.delete(code);
  }

  listPublicRooms() {
    return [...this.rooms.values()]
      .filter((r) => !r.settings.isPrivate && r.state === 'lobby')
      .map((r) => ({
        code: r.code,
        hostName: r.hostName,
        playerCount: r.connectedPlayerCount(),
        maxPlayers: r.settings.maxPlayers,
      }));
  }
}

module.exports = RoomManager;
