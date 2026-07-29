export default function WordChoiceModal({ options, chooseTime, onChoose }) {
  if (!options) return null;

  return (
    <div className="word-modal-overlay">
      <div className="word-modal">
        <h2>Choose a word to draw</h2>
        <p style={{ color: '#666', fontSize: 13 }}>Auto-picks the first option in {chooseTime}s if you don't choose.</p>
        {options.map((word) => (
          <button key={word} type="button" className="word-choice-btn" onClick={() => onChoose(word)}>
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
