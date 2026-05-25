# 🧠 MindGuard AI — Mental Wellness App

A complete, modern AI-powered mental health app built with **React Native (Expo)** + **FastAPI** + **HuggingFace ML models** + **Gemini 2.0 Flash AI**.

---

## 🚀 Running the Project

### 1. Start the Backend
```powershell
cd "MindGuard AI\backend"
.venv\Scripts\python run.py
```
> Backend runs on **http://localhost:8000**  
> HuggingFace models load in background (~1-2 min on first run, cached after)

### 2. Start the Frontend
```powershell
cd "MindGuard AI\frontend"
npx expo start
```
> Expo runs on **http://localhost:8081**

### 3. Open in App / Browser
| Platform | How |
|---|---|
| **Web browser** | Press `W` in the Expo terminal |
| **Android Emulator** | Press `A` in the Expo terminal |
| **Expo Go (phone)** | Scan the QR code with Expo Go app |
| **Expo Go (LAN)** | Edit `EXPO_GO_LAN_IP` in `frontend/src/services/api.js` to your PC's IP |

> **For Expo Go on phone**: Set your LAN IP in `api.js` line ~18:
> ```js
> const EXPO_GO_LAN_IP = '192.168.1.100'; // Your PC's WiFi IP (run `ipconfig`)
> ```

---

## ✨ Features

| Feature | Status | Technology |
|---|---|---|
| 🔐 User Registration & Login | ✅ | JWT + bcrypt |
| 📊 Daily Mood Tracking | ✅ | 5-step check-in form |
| 🤖 AI Chatbot (Emotional Support) | ✅ | **Gemini 2.5 Flash** |
| 📈 Stress Level Prediction (ML) | ✅ | 4 HuggingFace models |
| 🧘 Breathing Exercises | ✅ | 5 exercises with animation |
| 💡 Personalized Wellness Tips | ✅ | Stress-level tailored |
| 📉 History & Analytics Charts | ✅ | Line + Bar chart toggle |

---

## 🤖 AI Models Used

### Stress Prediction (4-Model Ensemble)
| Model | Purpose | Year |
|---|---|---|
| `cardiffnlp/twitter-roberta-base-sentiment-latest` | Sentiment (negative/neutral/positive) | 2024 |
| `SamLowe/roberta-base-go_emotions` | 28 fine-grained emotions | 2024 |
| `j-hartmann/emotion-english-distilroberta-base` | 7-class emotion classifier | 2023 |
| `cross-encoder/nli-deberta-v3-small` | Zero-shot stress labels (NLI) | 2023 |

### Chatbot
| Model | Purpose |
|---|---|
| `gemini-2.0-flash` | Primary empathetic AI responses |
| `gemini-1.5-flash` | Fallback if 2.0 unavailable |
| Built-in responses | Offline fallback |

---

## 🏗 Project Structure

```
MindGuard AI/
├── backend/
│   ├── app/
│   │   ├── core/       # config.py, security.py (bcrypt JWT)
│   │   ├── ml/         # predictor.py (4-model ensemble)
│   │   ├── models/     # SQLAlchemy DB models
│   │   ├── routers/    # auth, mood, chat, wellness, meditation, history
│   │   └── schemas/    # Pydantic request/response schemas
│   ├── .env            # API keys (Gemini key set)
│   ├── requirements.txt
│   └── run.py
└── frontend/
    ├── src/
    │   ├── context/    # AuthContext.js
    │   ├── navigation/ # AppNavigator.js (animated tab bar)
    │   ├── screens/    # 8 screens (Home, Chat, Mood, etc.)
    │   ├── services/   # api.js (axios + interceptors)
    │   └── theme/      # colors.js (dark glassmorphism)
    ├── babel.config.js  # reanimated plugin
    ├── app.json
    └── package.json
```

---

## 🎨 Design System
- **Theme**: Deep space dark glassmorphism
- **Colors**: Purple (`#7C3AED`) + Cyan (`#06B6D4`) + Pink (`#EC4899`)
- **Animations**: React Native Reanimated v4 (tab bar), Animated API (bubbles, orbs, confetti)
- **Glassmorphism**: `expo-blur` BlurView + linear gradients

---

## 🔧 Environment Variables (backend/.env)
```env
GEMINI_API_KEY=AIzaSyDG_xOO5XD0QAXf0BVJi7UlUwiX6mLdYl8
SECRET_KEY=mindguard-super-secret-jwt-key-2024
DATABASE_URL=sqlite:///./data/mindguard.db
```
