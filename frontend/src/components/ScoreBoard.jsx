import { useGame } from '../context/GameContext.jsx';
import { avatarColor } from '../utils/avatarColor.js';

export default function ScoreBoard() {
  const { state } = useGame();
  const sorted = [...state.players].sort((a, b) => b.score - a.score);

  return (
    <div className="panel">
      <h3>Players</h3>
      <ul className="player-list">
        {sorted.map((p) => (
          <li key={p.id}>
            <span className="player-info">
              <span className="avatar" style={{ background: avatarColor(p.id) }}>
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              {p.name}
              {p.id === state.drawerId && <span title="Drawing">✏️</span>}
              {p.hasGuessedCorrectly && <span title="Guessed correctly">✅</span>}
              {p.id === state.you?.id && <span className="badge badge-you">You</span>}
            </span>
            <span className="score-pill">{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
