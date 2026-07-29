const RoomManager = require('../classes/RoomManager');
const Game = require('../classes/Game');

const DEFAULT_SETTINGS = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 80,
  wordCount: 3,
  hints: 2,
  isPrivate: false,
};

function clamp(value, min, max, fallback) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeSettings(settings = {}) {
  return {
    maxPlayers: clamp(settings.maxPlayers, 2, 20, DEFAULT_SETTINGS.maxPlayers),
    rounds: clamp(settings.rounds, 2, 10, DEFAULT_SETTINGS.rounds),
    drawTime: clamp(settings.drawTime, 15, 240, DEFAULT_SETTINGS.drawTime),
    wordCount: clamp(settings.wordCount, 1, 5, DEFAULT_SETTINGS.wordCount),
    hints: clamp(settings.hints, 0, 5, DEFAULT_SETTINGS.hints),
    isPrivate: Boolean(settings.isPrivate),
  };
}

function sanitizeName(name) {
  return String(name || '').trim().slice(0, 20) || `Player${Math.floor(Math.random() * 10000)}`;
}

/** Registers all Socket.IO event handlers. Acts as the MessageHandler for the app. */
function registerSocketHandlers(io) {
  const roomManager = new RoomManager(io);

  io.on('connection', (socket) => {
    socket.on('create_room', ({ hostName, settings } = {}) => {
      const cleanName = sanitizeName(hostName);
      const cleanSettings = sanitizeSettings(settings);

      const { room, player } = roomManager.createRoom({
        hostName: cleanName,
        settings: cleanSettings,
        socketId: socket.id,
      });

      socket.join(room.code);
      socket.emit('room_joined', {
        code: room.code,
        hostId: room.hostId,
        settings: room.settings,
        players: room.publicPlayerList(),
        you: player.toPublic(),
      });
    });

    socket.on('join_room', ({ roomId, playerName } = {}) => {
      const cleanName = sanitizeName(playerName);
      const result = roomManager.joinRoom({ code: roomId, playerName: cleanName, socketId: socket.id });

      if (result.error) {
        socket.emit('join_error', { message: result.error });
        return;
      }

      const { room, player } = result;
      socket.join(room.code);

      socket.emit('room_joined', {
        code: room.code,
        hostId: room.hostId,
        settings: room.settings,
        players: room.publicPlayerList(),
        you: player.toPublic(),
      });

      room.broadcast('player_joined', { player: player.toPublic(), players: room.publicPlayerList() });
    });

    socket.on('start_game', () => {
      const room = roomManager.findRoomBySocket(socket.id);
      if (!room) return;
      if (!room.isHost(socket.id)) {
        socket.emit('join_error', { message: 'Only the host can start the game.' });
        return;
      }
      if (!room.canStart()) {
        socket.emit('join_error', { message: 'Need at least 2 players to start.' });
        return;
      }

      room.game = new Game(room);
      room.game.start();
    });

    socket.on('word_chosen', ({ word } = {}) => {
      const room = roomManager.findRoomBySocket(socket.id);
      if (!room || !room.game) return;
      const drawer = room.game.currentDrawer;
      if (!drawer || drawer.id !== socket.id) return;
      room.game.chooseWord(word);
    });

    socket.on('draw_start', (data) => relayDrawEvent(room_of(socket, roomManager), socket, 'draw_data', { type: 'start', ...data }));
    socket.on('draw_move', (data) => relayDrawEvent(room_of(socket, roomManager), socket, 'draw_data', { type: 'move', ...data }));
    socket.on('draw_end', (data) => relayDrawEvent(room_of(socket, roomManager), socket, 'draw_data', { type: 'end', ...data }));

    socket.on('canvas_clear', () => {
      const room = room_of(socket, roomManager);
      if (!isCurrentDrawer(room, socket.id)) return;
      room.broadcast('canvas_clear', {});
    });

    socket.on('draw_undo', () => {
      const room = room_of(socket, roomManager);
      if (!isCurrentDrawer(room, socket.id)) return;
      room.broadcast('draw_undo', {});
    });

    socket.on('guess', ({ text } = {}) => {
      const room = room_of(socket, roomManager);
      if (!room || !room.game || !text) return;
      room.game.checkGuess(socket.id, String(text).slice(0, 200));
    });

    socket.on('chat', ({ text } = {}) => {
      const room = room_of(socket, roomManager);
      if (!room || !text) return;
      const player = room.getPlayer(socket.id);
      if (!player) return;
      room.broadcast('chat_message', {
        playerId: player.id,
        playerName: player.name,
        text: String(text).slice(0, 200),
        type: 'chat',
      });
    });

    socket.on('disconnect', () => {
      const room = roomManager.findRoomBySocket(socket.id);
      if (!room) return;

      const player = room.getPlayer(socket.id);
      if (!player) return;

      player.connected = false;
      room.removePlayer(socket.id);

      if (room.isEmpty()) {
        if (room.game) room.game.clearTimers();
        roomManager.removeRoom(room.code);
        return;
      }

      if (room.isHost(socket.id)) {
        const nextHost = [...room.players.values()][0];
        if (nextHost) {
          room.hostId = nextHost.id;
          nextHost.isHost = true;
        }
      }

      room.broadcast('player_left', { playerId: socket.id, players: room.publicPlayerList() });

      if (room.game && room.game.phase !== 'game_over' && room.game.currentDrawer && room.game.currentDrawer.id === socket.id) {
        room.game.endRound('drawer_left');
      }
    });
  });
}

function room_of(socket, roomManager) {
  return roomManager.findRoomBySocket(socket.id);
}

function isCurrentDrawer(room, socketId) {
  return Boolean(room && room.game && room.game.currentDrawer && room.game.currentDrawer.id === socketId);
}

function relayDrawEvent(room, socket, event, payload) {
  if (!isCurrentDrawer(room, socket.id)) return;
  room.broadcast(event, payload);
}

module.exports = { registerSocketHandlers };
