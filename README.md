# 🧠 MindGuard AI

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000.svg?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.115-029886.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![HuggingFace](https://img.shields.io/badge/%F0%9F%A4%97-HuggingFace-yellow.svg?style=flat-square)](https://huggingface.co)
[![Gemini](https://img.shields.io/badge/Google-Gemini%203.5%20Flash-blue.svg?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black.svg?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

MindGuard AI is a premium, privacy-first mental health and emotional intelligence platform. By combining the sleek, responsive UI of a **React Native (Expo)** client with a low-latency **FastAPI** backend, MindGuard AI provides users with a cognitive sanctuary. 

The application runs real-time sentiment analytics through a **4-Model NLP Machine Learning Ensemble** (HuggingFace) and matches it with context-aware, empathetic guidance powered by **Google Gemini 3.5 Flash**.

---

## ✨ Key Features

*   **🔒 Secure Sanctuary**: Relational database architecture secured via **JWT tokens** and **bcrypt** password hashing, backed by **Neon Cloud PostgreSQL**.
*   **📊 Daily Mood Check-In**: A modern 5-step interactive telemetry form tracking mood, sleep, anxiety, activity, and journal entries.
*   **🤖 Empathetic AI Companion**: Dynamic wellness chat with real-time suggestion chips, a smooth typing indicator, and context-injected mood awareness.
*   **🧘 Breathing Sanctuary**: Color-coded guided Navy SEAL Box Breathing simulator with completion confetti bursts.
*   **📈 Analytics Dashboard**: Interactive analytics suite with a custom line/bar chart toggle to visualize mood history and stress patterns.
*   **💡 Wellness Sanctuary**: Dynamic, stress-level-tailored advice cards with custom checks and progress feedback.

---

## 🤖 The AI Engine & Exact Models Used

MindGuard AI operates a dual-layer AI setup to analyze cognitive telemetry and construct empathetic responses:

### 1. Stress Prediction Ensemble (4 NLP Models)
When you submit a check-in, the backend runs your journal text in parallel through **four specialized transformer models** via the HuggingFace Inference API to evaluate stress level (`LOW`, `MODERATE`, `HIGH`) and confidence scores:

| Model ID / Path | Purpose | Weight |
|:---|:---|:---:|
| `cardiffnlp/twitter-roberta-base-sentiment-latest` | Sentiment Analysis (Negative / Neutral / Positive) | **25%** |
| `SamLowe/roberta-base-go_emotions` | Fine-grained classification (28 custom emotions) | **30%** |
| `j-hartmann/emotion-english-distilroberta-base` | Core emotion classification (7 primary classes) | **25%** |
| `cross-encoder/nli-deberta-v3-small` | Zero-shot Stress Natural Language Inference (NLI) | **20%** |

### 2. Conversational Companion (Google Gemini API)
MindGuard AI utilizes a cascading fallback chain to guarantee high availability and fast chatbot responses:

1.  **`gemini-3.5-flash`** (Primary — Google's latest default high-speed model)
2.  **`gemini-3.1-flash-lite`** (Secondary fallback)
3.  **`gemini-2.5-flash`** (Tertiary fallback)
4.  **`gemini-1.5-flash`** (Legacy fallback)

---

## 🏗️ System Directory Layout

```text
MindGuard AI/
├── backend/
│   ├── app/
│   │   ├── core/       # Configurations, JWT encryption (security.py)
│   │   ├── ml/         # Predictor logic (4-model HF ensemble)
│   │   ├── models/     # DB Schemas & SQLAlchemy entities
│   │   └── routers/    # Auth, Mood, Chat (Gemini), Analytics, Meditation
│   ├── requirements.txt
│   └── run.py          # Backend entry point
└── frontend/
    ├── src/
    │   ├── context/    # User Auth state machine
    │   ├── screens/    # 8 Screen Layouts (Home, Chat, Mood, Meditation, etc.)
    │   ├── services/   # api.js (Axios base configuration with JWT interceptors)
    │   └── theme/      # colors.js (Deep-space dark glassmorphism system)
    └── package.json    # Expo configuration and script shortcuts
```

---

## 🚀 Quick Start & Installation

### 1. Backend Setup (FastAPI)
1.  Navigate into the backend folder:
    ```bash
    cd backend
    ```
2.  Set up and activate your virtual environment:
    ```bash
    python -m venv .venv
    # On Windows:
    .venv\Scripts\activate
    # On macOS/Linux:
    source .venv/bin/activate
    ```
3.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create your `.env` configuration file:
    ```env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    HF_API_KEY=YOUR_HUGGING_FACE_TOKEN
    DATABASE_URL=sqlite:///./data/mindguard.db
    SECRET_KEY=generate-a-secure-jwt-signing-key
    ```
5.  Start the local server:
    ```bash
    python run.py
    ```
    *Local server runs on **`http://localhost:8000`***

### 2. Frontend Setup (React Native / Expo)
1.  Navigate into the frontend folder:
    ```bash
    cd ../frontend
    ```
2.  Clean install dependencies matching **Expo SDK 54**:
    ```bash
    npm install --legacy-peer-deps
    ```
3.  Start the project:
    *   **LAN Mode** (Requires device to be on the same Wi-Fi network):
        ```bash
        npx expo start --lan --clear
        ```
    *   **Tunnel Mode** (Share your QR code with any phone globally):
        ```bash
        # 1. Add your free Ngrok auth token
        npx ngrok authtoken YOUR_NGROK_TOKEN
        
        # 2. Run the tunnel script
        npm run tunnel -- --clear
        ```
4.  Scan the QR code printed on your screen using the **Expo Go** app!

---

## 🎨 Theme Design System

*   **Vibe**: Calming, premium deep space glassmorphism
*   **Core Palette**: Royal Purple (`#7C3AED`) • Neon Cyan (`#06B6D4`) • Velvet Pink (`#EC4899`)
*   **Visual Assets**: Built using `expo-blur` and custom CSS overlays to create frosted glass-style cards that render with maximum performance.
