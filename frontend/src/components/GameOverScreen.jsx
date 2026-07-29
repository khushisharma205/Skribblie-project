import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';

export default function GameOverScreen() {
  const { state, resetGame } = useGame();
  const navigate = useNavigate();
  const result = state.gameOverResult;
  if (!result) return null;

  const sorted = [...result.leaderboard].sort((a, b) => b.score - a.score);

  const handleBackHome = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className="overlay-screen">
      <div className="overlay-card">
        <h2>Game over!</h2>
        <p>🏆 Winner: <strong>{result.winner}</strong></p>
        <ul className="leaderboard-list">
          {sorted.map((p, idx) => (
            <li key={p.id}>
              <span>#{idx + 1} {p.name}</span>
              <span>{p.score} pts</span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-primary" onClick={handleBackHome}>Back to home</button>
      </div>
    </div>
  );
}
