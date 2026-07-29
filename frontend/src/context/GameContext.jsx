import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../services/socket';

const GameContext = createContext(null);

const initialState = {
  code: null,
  hostId: null,
  settings: null,
  players: [],
  you: null,
  phase: 'lobby',
  round: 0,
  totalRounds: 0,
  drawerId: null,
  drawerName: null,
  word: '',
  wordLength: 0,
  drawTime: 0,
  wordChoices: null,
  chatMessages: [],
  lastRoundResult: null,
  gameOverResult: null,
  error: null,
};

export function GameProvider({ children }) {
  const [state, setState] = useState(initialState);
  const msgIdRef = useRef(0);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const addChat = (msg) => {
      msgIdRef.current += 1;
      setState((s) => ({ ...s, chatMessages: [...s.chatMessages, { ...msg, id: msgIdRef.current }] }));
    };

    const onRoomJoined = (data) => {
      setState((s) => ({
        ...s,
        code: data.code,
        hostId: data.hostId,
        settings: data.settings,
        players: data.players,
        you: data.you,
        phase: 'lobby',
        error: null,
      }));
    };

    const onPlayerJoined = ({ players }) => setState((s) => ({ ...s, players }));
    const onPlayerLeft = ({ players }) => setState((s) => ({ ...s, players }));
    const onJoinError = ({ message }) => setState((s) => ({ ...s, error: message }));

    const onRoundStart = (data) => {
      setState((s) => ({
        ...s,
        phase: 'choosing',
        round: data.round,
        totalRounds: data.totalRounds,
        drawerId: data.drawerId,
        drawerName: data.drawerName,
        drawTime: data.drawTime,
        wordChoices: null,
        lastRoundResult: null,
      }));
    };

    const onWordChoices = (data) => {
      setState((s) => ({ ...s, wordChoices: data }));
    };

    const onGameState = (data) => {
      setState((s) => ({
        ...s,
        phase: data.phase,
        round: data.round,
        totalRounds: data.totalRounds,
        drawerId: data.drawerId,
        drawerName: data.drawerName,
        word: data.word,
        wordLength: data.wordLength,
        drawTime: data.drawTime,
        players: data.scores,
        wordChoices: data.phase === 'drawing' ? null : s.wordChoices,
      }));
    };

    const onRoundEnd = (data) => {
      setState((s) => ({ ...s, phase: 'round_end', lastRoundResult: data, players: data.scores }));
    };

    const onGameOver = (data) => {
      setState((s) => ({ ...s, phase: 'game_over', gameOverResult: data }));
    };

    const onGuessResult = (data) => {
      addChat({
        playerId: data.playerId,
        playerName: data.playerName,
        type: data.correct ? 'guess-correct' : 'guess-close',
        text: data.correct ? `guessed the word! (+${data.points})` : 'so close!',
      });
    };

    const onChatMessage = (data) => addChat(data);

    socket.on('room_joined', onRoomJoined);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('join_error', onJoinError);
    socket.on('round_start', onRoundStart);
    socket.on('word_choices', onWordChoices);
    socket.on('game_state', onGameState);
    socket.on('round_end', onRoundEnd);
    socket.on('game_over', onGameOver);
    socket.on('guess_result', onGuessResult);
    socket.on('chat_message', onChatMessage);

    return () => {
      socket.off('room_joined', onRoomJoined);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('join_error', onJoinError);
      socket.off('round_start', onRoundStart);
      socket.off('word_choices', onWordChoices);
      socket.off('game_state', onGameState);
      socket.off('round_end', onRoundEnd);
      socket.off('game_over', onGameOver);
      socket.off('guess_result', onGuessResult);
      socket.off('chat_message', onChatMessage);
    };
  }, []);

  const createRoom = useCallback((hostName, settings) => {
    socket.emit('create_room', { hostName, settings });
  }, []);

  const joinRoom = useCallback((roomId, playerName) => {
    socket.emit('join_room', { roomId, playerName });
  }, []);

  const startGame = useCallback(() => socket.emit('start_game'), []);
  const chooseWord = useCallback((word) => socket.emit('word_chosen', { word }), []);
  const sendGuess = useCallback((text) => socket.emit('guess', { text }), []);
  const sendChat = useCallback((text) => socket.emit('chat', { text }), []);
  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);
  const resetGame = useCallback(() => setState(initialState), []);

  return (
    <GameContext.Provider
      value={{ state, createRoom, joinRoom, startGame, chooseWord, sendGuess, sendChat, clearError, resetGame }}
    >
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
  return useContext(GameContext);
}
