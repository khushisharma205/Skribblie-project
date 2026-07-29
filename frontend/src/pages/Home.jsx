import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import NavBar from '../components/NavBar.jsx';

const DEFAULT_SETTINGS = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 80,
  wordCount: 3,
  hints: 2,
  isPrivate: false,
};

export default function Home() {
  const navigate = useNavigate();
  const { state, createRoom, joinRoom, clearError } = useGame();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState(searchParams.get('join') ? 'join' : 'create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(searchParams.get('join')?.toUpperCase() || '');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user.username);
  }, [user]);

  useEffect(() => {
    if (state.code) {
      navigate(`/lobby/${state.code}`);
    }
  }, [state.code, navigate]);

  const updateSetting = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    clearError();
    createRoom(name.trim(), settings);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    clearError();
    joinRoom(roomCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="page">
      <NavBar />

      <div className="page-content">
        <div className="hero">
          <span className="eyebrow">Free · Real-time · No install</span>
          <h1 className="title">Draw. Guess. Win.</h1>
          <p className="subtitle">
            Jump into a room with friends, take turns sketching a secret word, and race to guess
            it first.
          </p>
        </div>

        <div className="card">
          <div className="field">
            <label>Your display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="e.g. Alice"
              required
            />
          </div>

          <div className="tabs">
            <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
              Create a room
            </button>
            <button type="button" className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
              Join a room
            </button>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreate}>
              <div className="settings-grid">
                <SliderField
                  label="Max players"
                  value={settings.maxPlayers}
                  min={2}
                  max={20}
                  onChange={(v) => updateSetting('maxPlayers', v)}
                />
                <SliderField
                  label="Rounds"
                  value={settings.rounds}
                  min={2}
                  max={10}
                  onChange={(v) => updateSetting('rounds', v)}
                />
                <SliderField
                  label="Draw time"
                  value={settings.drawTime}
                  min={15}
                  max={240}
                  step={5}
                  suffix="s"
                  onChange={(v) => updateSetting('drawTime', v)}
                />
                <SliderField
                  label="Word choices"
                  value={settings.wordCount}
                  min={1}
                  max={5}
                  onChange={(v) => updateSetting('wordCount', v)}
                />
                <SliderField
                  label="Hints"
                  value={settings.hints}
                  min={0}
                  max={5}
                  onChange={(v) => updateSetting('hints', v)}
                />

                <div className="switch-row">
                  <label>Private room (invite link only)</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.isPrivate}
                      onChange={(e) => updateSetting('isPrivate', e.target.checked)}
                    />
                    <span className="switch-track" />
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
                Create room
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin}>
              <div className="field">
                <label>Room code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder="e.g. AB12CD"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Join room
              </button>
            </form>
          )}

          {state.error && <p className="error-text">{state.error}</p>}
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step = 1, suffix = '', onChange }) {
  return (
    <div className="slider-field">
      <div className="slider-row">
        <label>{label}</label>
        <span className="slider-value">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
