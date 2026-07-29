import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();

  const [authMode, setAuthMode] = useState('login');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (authMode === 'login') {
        await login(form.username, form.password);
      } else {
        await register(
          form.username,
          form.email,
          form.password
        );
      }

      onClose();

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
      >

        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>


        <div className="card-header">
          <h2>
            {authMode === 'login'
              ? 'Welcome back'
              : 'Create an account'}
          </h2>

          <p>
            Optional — save your win/loss stats across sessions.
          </p>
        </div>


        <div className="tabs">

          <button
            type="button"
            className={authMode === 'login' ? 'active' : ''}
            onClick={() => setAuthMode('login')}
          >
            Log in
          </button>


          <button
            type="button"
            className={authMode === 'register' ? 'active' : ''}
            onClick={() => setAuthMode('register')}
          >
            Register
          </button>

        </div>


        <form onSubmit={handleSubmit}>

          {/* Username */}
          <div className="field">
            <label>Username</label>

            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  username: e.target.value
                }))
              }
              autoComplete="username"
              required
            />
          </div>


          {/* Email only for Register */}
          {authMode === 'register' && (
            <div className="field">
              <label>Email</label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    email: e.target.value
                  }))
                }
                autoComplete="email"
                required
              />
            </div>
          )}


          {/* Password */}
          <div className="field">
            <label>Password</label>

            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  password: e.target.value
                }))
              }
              autoComplete={
                authMode === 'login'
                  ? 'current-password'
                  : 'new-password'
              }
              required
            />
          </div>


          {error && <p className="error-text">{error}</p>}


          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {
              submitting
                ? 'Please wait...'
                : authMode === 'login'
                  ? 'Log in'
                  : 'Create account'
            }
          </button>


        </form>

      </div>
    </div>
  );
}