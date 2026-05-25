import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('mindguard_token'),
        AsyncStorage.getItem('mindguard_user'),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Auth load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, user: userData } = res.data;
    await Promise.all([
      AsyncStorage.setItem('mindguard_token', access_token),
      AsyncStorage.setItem('mindguard_user', JSON.stringify(userData)),
    ]);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password) => {
    const res = await authAPI.register({ username, email, password });
    const { access_token, user: userData } = res.data;
    await Promise.all([
      AsyncStorage.setItem('mindguard_token', access_token),
      AsyncStorage.setItem('mindguard_user', JSON.stringify(userData)),
    ]);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('mindguard_token'),
        AsyncStorage.removeItem('mindguard_user'),
      ]);
    } catch (e) {
      console.log('Logout storage error:', e);
    }
    setToken(null);
    setUser(null);
  }, []);

  // 401 auto-logout — called by the api.js interceptor via event pattern
  // The api.js interceptor removes storage, and this effect picks it up on next app focus.
  // For immediate logout, we expose a forceLogout that can be called by screens directly.
  const forceLogout = useCallback(async () => {
    console.log('Force logout triggered (401 detected)');
    await logout();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, forceLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
