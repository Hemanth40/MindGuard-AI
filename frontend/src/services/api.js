import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─────────────────────────────────────────────────────────────────────────────
// Backend URL strategy:
//   RENDER_URL  → Production backend on Render (accessible from anywhere)
//   Local URL   → Your PC's IP (only works on same WiFi network)
//
// Rules:
//   • Web browser in dev  → localhost:8000
//   • Real device (Expo Go) outside local network → RENDER_URL
//   • Real device on same WiFi as PC → auto-detects PC's local IP
//   • Android emulator → 10.0.2.2:8000
// ─────────────────────────────────────────────────────────────────────────────

// ✅ Live Render backend — accessible from anywhere worldwide
const RENDER_URL = 'https://mindguard-ai-backend.onrender.com';

// true = always use Render (Expo Go on any network anywhere)
// false = use local PC IP (only works on same WiFi)
const USE_RENDER = true;

function getBaseURL() {
  // Always use Render for production / real device access
  if (USE_RENDER) {
    return RENDER_URL;
  }

  // Web browser in development
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  // Expo Go on real phone: auto-detect PC's IP from dev server host
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoClient?.hostUri ||
      Constants.manifest?.debuggerHost ||
      '';

    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8000`;
      }
    }
  } catch (_) {}

  // Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
}

export const API_BASE = getBaseURL();
console.log('[API] Base URL:', API_BASE);

// ── Axios instance ──
const api = axios.create({
  baseURL: API_BASE,
  timeout: 45000,   // 45s — HF Inference API can take up to 30s on cold start
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ──
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('mindguard_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// ── Response interceptor: 401 auto-logout ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove(['mindguard_token', 'mindguard_user']);
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
  me:       ()     => api.get('/api/auth/me'),
};

// ── Mood ──
export const moodAPI = {
  create:    (data)      => api.post('/api/mood', data),
  getToday:  ()          => api.get('/api/mood/today'),
  getRecent: (limit = 7) => api.get(`/api/mood/recent?limit=${limit}`),
};

// ── Predict ──
export const predictAPI = {
  predict: (data) => api.post('/api/predict', data),
};

// ── Chat ──
export const chatAPI = {
  send:         (data)       => api.post('/api/chat', data),
  getHistory:   (limit = 20) => api.get(`/api/chat/history?limit=${limit}`),
  clearHistory: ()           => api.delete('/api/chat/clear'),
};

// ── Wellness ──
export const wellnessAPI = {
  getTips: (stressLevel) => api.get(`/api/wellness/${stressLevel}`),
};

// ── Meditation ──
export const meditationAPI = {
  getExercises: ()    => api.get('/api/meditation/exercises'),
  getExercise:  (id)  => api.get(`/api/meditation/${id}`),
};

// ── History ──
export const historyAPI = {
  getMoodHistory: (days = 30) => api.get(`/api/history/mood?days=${days}`),
  getStats:       ()          => api.get('/api/history/stats'),
};

export default api;
