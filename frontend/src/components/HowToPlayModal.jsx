const STEPS = [
  {
    title: '1. Create or join a room',
    body: 'Enter a display name, then create a room (configure players, rounds, draw time, word choices, hints) or join one with a code or invite link.',
  },
  {
    title: '2. Wait in the lobby',
    body: 'Once at least 2 players have joined, the host clicks "Start game" to begin.',
  },
  {
    title: '3. Pick a word to draw',
    body: 'Each round, one player is chosen to draw and picks from a few word options (auto-picked if they wait too long).',
  },
  {
    title: '4. Draw or guess',
    body: 'The drawer sketches with the color/brush/eraser/undo/clear tools while everyone else types guesses in chat. Letters are revealed as hints over time.',
  },
  {
    title: '5. Score points',
    body: 'Guessing correctly and quickly earns more points. The drawer also earns points based on how many players guessed correctly.',
  },
  {
    title: '6. Win the game',
    body: 'Every player takes a turn drawing once per round. After all rounds finish, the leaderboard crowns a winner.',
  },
];

export default function HowToPlayModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="card-header">
          <h2>How to play</h2>
          <p>A quick rundown of a round of Skribblie.</p>
        </div>

        <ol className="howto-list">
          {STEPS.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>

        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
