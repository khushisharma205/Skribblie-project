import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import HowToPlayModal from './HowToPlayModal.jsx';

function initials(name) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

export default function NavBar() {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  return (
    <>
      <header className="navbar">
        <span className="brand">
          <span className="brand-mark">🎨</span>
          Skribblie
        </span>

        <div className="nav-auth">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHowTo(true)}>
            How to play
          </button>

          {user ? (
            <>
              <span className="user-pill">
                <span className="avatar" style={{ background: 'var(--color-primary)' }}>
                  {initials(user.username)}
                </span>
                {user.username}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-sm" onClick={() => setShowAuth(true)}>
              Sign in
            </button>
          )}
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
    </>
  );
}
