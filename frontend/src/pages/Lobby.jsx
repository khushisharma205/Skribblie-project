import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import NavBar from '../components/NavBar.jsx';
import { avatarColor } from '../utils/avatarColor.js';

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { state, startGame } = useGame();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!state.code) {
      navigate('/');
      return;
    }
    if (state.phase === 'choosing' || state.phase === 'drawing') {
      navigate(`/game/${state.code}`);
    }
  }, [state.code, state.phase, navigate]);

  if (!state.code) return null;

  const inviteLink = `${window.location.origin}/?join=${code}`;
  const isHost = state.you && state.you.id === state.hostId;
  const canStart = state.players.filter((p) => p.connected !== false).length >= 2;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API may be unavailable; ignore silently
    }
  };

  return (
    <div className="page">
      <NavBar />

      <div className="page-content">
        <div className="hero">
          <span className="eyebrow">Lobby</span>
          <h1 className="title">Waiting to start</h1>
          <p className="subtitle">Share the invite link below and wait for the host to begin.</p>
        </div>

        <div className="lobby-layout">
          <div className="card">
            <div className="card-header">
              <h2>
                Room code: <span className="room-code-badge">{code}</span>
              </h2>
              <p>Anyone with the link below can join instantly.</p>
            </div>
            <div className="invite-box">
              <input readOnly value={inviteLink} />
              <button type="button" className="btn btn-sm" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="meta-row">
              <span className="meta-chip">{state.settings?.isPrivate ? 'Private room' : 'Public room'}</span>
              <span className="meta-chip">{state.settings?.rounds} rounds</span>
              <span className="meta-chip">{state.settings?.drawTime}s draw time</span>
              <span className="meta-chip">{state.settings?.wordCount} word choices</span>
              <span className="meta-chip">{state.settings?.hints} hints</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Players ({state.players.length}/{state.settings?.maxPlayers})</h2>
            </div>
            <ul className="player-list">
              {state.players.map((p) => (
                <li key={p.id}>
                  <span className="player-info">
                    <span className="avatar" style={{ background: avatarColor(p.id) }}>
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    {p.name}
                    {p.isHost && <span className="badge badge-host">Host</span>}
                    {p.id === state.you?.id && <span className="badge badge-you">You</span>}
                  </span>
                  <span className="score-pill">{p.score} pts</span>
                </li>
              ))}
            </ul>

            {isHost ? (
              <button
                type="button"
                className="btn btn-primary btn-block"
                style={{ marginTop: 18 }}
                disabled={!canStart}
                onClick={startGame}
              >
                {canStart ? 'Start game' : 'Need at least 2 players'}
              </button>
            ) : (
              <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--color-text-muted)', fontSize: 13.5 }}>
                Waiting for the host to start the game...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
