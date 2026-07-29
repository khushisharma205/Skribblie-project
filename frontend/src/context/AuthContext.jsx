import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  // Check logged in user
  useEffect(() => {
    if (!token) return;

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      });
  }, [token]);


  // Login API
  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', {
      username,
      password,
    });

    localStorage.setItem('token', res.data.token);

    setToken(res.data.token);
    setUser(res.data.user);

    return res.data.user;
  }, []);


  // Register API with email
  const register = useCallback(async (username, email, password) => {
    const res = await api.post('/auth/register', {
      username,
      email,
      password,
    });

    localStorage.setItem('token', res.data.token);

    setToken(res.data.token);
    setUser(res.data.user);

    return res.data.user;
  }, []);


  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');

    setToken(null);
    setUser(null);
  }, []);


  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// Custom hook
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}