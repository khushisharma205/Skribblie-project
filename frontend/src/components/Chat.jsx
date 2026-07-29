import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext.jsx';

export default function Chat() {
  const { state, sendGuess, sendChat } = useGame();
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [state.chatMessages]);

  const isDrawer = state.you && state.drawerId === state.you.id;
  const alreadyGuessed = state.players.find((p) => p.id === state.you?.id)?.hasGuessedCorrectly;
  const canGuess = state.phase === 'drawing' && !isDrawer && !alreadyGuessed;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (canGuess) {
      sendGuess(text.trim());
    } else {
      sendChat(text.trim());
    }
    setText('');
  };

  return (
    <div className="panel chat-panel">
      <h3>Chat & Guesses</h3>
      <div className="chat-messages" ref={listRef}>
        {state.chatMessages.map((m) => (
          <div key={m.id} className={m.type}>
            {m.type === 'system' ? (
              <span>{m.text}</span>
            ) : m.type === 'guess-correct' || m.type === 'guess-close' ? (
              <span>{m.playerName} {m.text}</span>
            ) : (
              <span><strong>{m.playerName}:</strong> {m.text}</span>
            )}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={canGuess ? 'Type your guess...' : 'Chat...'}
          maxLength={200}
        />
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
    </div>
  );
}
