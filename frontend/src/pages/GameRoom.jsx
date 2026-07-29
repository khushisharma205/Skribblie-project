import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import DrawingCanvas from '../components/DrawingCanvas.jsx';
import WordChoiceModal from '../components/WordChoiceModal.jsx';
import Chat from '../components/Chat.jsx';
import ScoreBoard from '../components/ScoreBoard.jsx';
import GameOverScreen from '../components/GameOverScreen.jsx';
import HowToPlayModal from '../components/HowToPlayModal.jsx';

export default function GameRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { state, chooseWord, resetGame } = useGame();
  const [timeLeft, setTimeLeft] = useState(0);
  const [showHowTo, setShowHowTo] = useState(false);

  const isDrawer = state.you && state.drawerId === state.you.id;
  const resetSignal = `${state.round}-${state.drawerId}`;

  useEffect(() => {
    if (!state.code) {
      navigate('/');
    }
  }, [state.code, navigate]);

  useEffect(() => {
    if (state.phase !== 'drawing') return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset countdown for the new round
    setTimeLeft(state.drawTime);
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.drawTime, resetSignal]);

  if (!state.code) return null;

  const timerPct = state.drawTime > 0 ? Math.max(0, Math.min(100, (timeLeft / state.drawTime) * 100)) : 0;

  const handleLeave = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="game-page">
          <div className="game-topbar">
            <span>
              Room <strong style={{ letterSpacing: '0.05em' }}>{code}</strong> &middot; Round{' '}
              {state.round}/{state.totalRounds}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHowTo(true)}>
                How to play
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLeave}>
                Leave game
              </button>
            </div>
          </div>

          <div className="game-layout">
            <ScoreBoard />

            <div className="panel canvas-area">
              <div className="turn-status">
                {isDrawer ? 'Your turn to draw!' : (
                  <>
                    <strong>{state.drawerName || '...'}</strong> is drawing
                  </>
                )}
              </div>
              <div className="word-banner">
                {state.phase === 'choosing' ? 'Choosing a word...' : (state.word || '').split('').join(' ')}
              </div>
              {state.phase === 'drawing' && (
                <div className="timer-bar-track">
                  <div className="timer-bar-fill" style={{ width: `${timerPct}%` }} />
                </div>
              )}

              <DrawingCanvas isDrawer={Boolean(isDrawer)} resetSignal={resetSignal} />
            </div>

            <Chat />
          </div>
        </div>
      </div>

      {isDrawer && state.phase === 'choosing' && state.wordChoices && (
        <WordChoiceModal
          options={state.wordChoices.options}
          chooseTime={state.wordChoices.chooseTime}
          onChoose={chooseWord}
        />
      )}

      {state.phase === 'round_end' && state.lastRoundResult && (
        <div className="overlay-screen">
          <div className="overlay-card">
            <h2>Round over!</h2>
            <p>
              The word was: <strong>{state.lastRoundResult.word}</strong>
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 8 }}>
              Next round starting soon...
            </p>
          </div>
        </div>
      )}

      {state.phase === 'game_over' && <GameOverScreen />}

      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
    </div>
  );
}
