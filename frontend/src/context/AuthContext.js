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

  const enterSanctuary = async (name) => {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      throw new Error('Please enter your name');
    }

    try {
      const res = await authAPI.quickStart({ name: cleanName });
      const { access_token, user: userData } = res.data;
      await Promise.all([
        AsyncStorage.setItem('mindguard_token', access_token),
        AsyncStorage.setItem('mindguard_user', JSON.stringify(userData)),
      ]);
      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (err) {
      console.log('quickStart attempt fallback...', err?.message);
      const safeSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'friend';
      const email = `${safeSlug}@mindguard.app`;
      const password = `mg_${safeSlug}_pass`;

      try {
        const res = await authAPI.login({ email, password });
        const { access_token, user: userData } = res.data;
        await Promise.all([
          AsyncStorage.setItem('mindguard_token', access_token),
          AsyncStorage.setItem('mindguard_user', JSON.stringify(userData)),
        ]);
        setToken(access_token);
        setUser(userData);
        return userData;
      } catch (loginErr) {
        try {
          const res = await authAPI.register({ username: cleanName, email, password });
          const { access_token, user: userData } = res.data;
          await Promise.all([
            AsyncStorage.setItem('mindguard_token', access_token),
            AsyncStorage.setItem('mindguard_user', JSON.stringify(userData)),
          ]);
          setToken(access_token);
          setUser(userData);
          return userData;
        } catch (regErr) {
          const localUser = { id: 1, username: cleanName, email };
          await AsyncStorage.setItem('mindguard_user', JSON.stringify(localUser));
          setUser(localUser);
          return localUser;
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, enterSanctuary, login, register, logout, forceLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
