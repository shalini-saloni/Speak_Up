import React, { useEffect, useState } from 'react';
import { AuthContext } from './authContext';
import { api, setApiToken } from '../lib/api';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(() => {
    // Never treat user as logged-in without a token
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  });
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    setApiToken(token);
  }, [token]);

  useEffect(() => {
    let ignore = false;
    async function bootstrap() {
      try {
        if (!token) return;
        const { data } = await api.get('/me');
        if (ignore) return;
        localStorage.setItem('user', JSON.stringify(data));
        setCurrentUser(data);
      } catch {
        if (ignore) return;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setCurrentUser(null);
      } finally {
        if (!ignore) setBootstrapped(true);
      }
    }
    bootstrap();
    return () => {
      ignore = true;
    };
  }, [token]);
  
  useEffect(() => {
    if (!token) {
      localStorage.removeItem('user');
      setCurrentUser(null);
      setBootstrapped(true);
    }
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  };
  
  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  const refreshMe = async () => {
    if (!token) return null;
    const { data } = await api.get('/me');
    localStorage.setItem('user', JSON.stringify(data));
    setCurrentUser(data);
    return data;
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    refreshMe,
    token,
    bootstrapped,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
