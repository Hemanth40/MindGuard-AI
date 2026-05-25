# 🧠 MindGuard AI — Full-Stack Mental Wellness & AI Analytics Platform
> **Comprehensive Engineering Project Report & Implementation Documentation**  
> *Architected with React Native (Expo SDK 54) • FastAPI Backend • HuggingFace NLP Ensemble • Gemini 3.5 Flash Conversational AI • Neon Cloud PostgreSQL*

---

## 📋 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Introduction & Problem Statement](#-introduction--problem-statement)
3. [System Architecture Design](#-system-architecture-design)
4. [Key Features & User Experience (UX)](#-key-features--user-experience-ux)
5. [AI & Machine Learning Engine](#-ai--machine-learning-engine)
6. [Software Engineering & Bug Resolution Report](#-software-engineering--bug-resolution-report)
7. [Installation & Local Deployment Guide](#-installation--local-deployment-guide)
8. [Cloud Infrastructure & Scaling Plan](#-cloud-infrastructure--scaling-plan)
9. [Conclusion & Future Roadmap](#-conclusion--future-roadmap)

---

## 📝 Executive Summary
**MindGuard AI** is a cutting-edge, privacy-focused mental health and emotional analytics application. By combining the rapid native responsiveness of **React Native (Expo SDK 54)** with a high-throughput **FastAPI** backend, the platform delivers a personal cognitive sanctuary. 

It features a specialized **4-Model Machine Learning Ensemble** hosted via HuggingFace for real-time stress and emotional classification, alongside an empathetic, context-aware chatbot powered by **Gemini 3.5 Flash**. The entire database layer is scaled in the cloud using **Neon PostgreSQL**, guaranteeing secure, relational storage. Designed with gorgeous deep-space glassmorphic aesthetics, MindGuard AI provides accessible, real-time wellness support without compromising data privacy.

---

## 🔍 Introduction & Problem Statement
### The Context
Modern society faces an unprecedented rise in chronic stress, anxiety, and depression. While digital mental health tools have grown, most existing solutions suffer from three fatal flaws:
1. **Severe Privacy Risk**: Traditional wellness apps stream sensitive, unencrypted thoughts and journal entries to centralized commercial clouds.
2. **Generic, Non-Contextual Feedback**: Standard bots provide static, copy-pasted advice (e.g., "drink water") rather than adapting to the user's immediate emotional state, sleep patterns, and physical activity.
3. **High Latency and Poor Accessibility**: Clunky, slow web interfaces fail to provide immediate, micro-interactive support when users suffer from acute stress or anxiety attacks.

### The MindGuard AI Solution
MindGuard AI addresses these limitations by establishing a **secure personal sanctuary** that is:
- **Relational & Encrypted**: All user credentials, mood logs, and chat histories are protected using industry-standard bcrypt hashing, JWT tokens, and secure PostgreSQL databases.
- **Cognitively Aware**: The platform analyzes daily metrics (mood, sleep, anxiety, activity, and free-text journals) using multi-model sentiment classifiers to generate highly precise stress labels (Low, Moderate, High).
- **Hyper-Personalized**: A custom-designed LLM prompt architecture injects the user's real-time physical and mental metrics directly into every chat session, ensuring the AI behaves like a warm, supportive, context-aware therapist.

---

## 🏗️ System Architecture Design
The platform uses a decoupled, client-server architecture built for low-latency native execution and robust cloud analytics:

```
                  ┌──────────────────────────────────────────┐
                  │          React Native Client             │
                  │             (Expo SDK 54)                │
                  └────────────────────┬─────────────────────┘
                                       │
                                       │ HTTPS / WSS (Axios)
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │             FastAPI Backend              │
                  │         (Uvicorn / ASGI Server)          │
                  └───────┬──────────────────────────┬───────┘
                          │                          │
        PostgreSQL        │                          │ HTTPS (REST API)
        (Neon Cloud DB)   ▼                          ▼
   ┌──────────────────────────┐      ┌───────────────────────────┐
   │  - Auth Credentials      │      │     HuggingFace API       │
   │  - Daily Mood Logs       │      │  (4-Model ML Ensemble)    │
   │  - Chat Histories        │      └───────────────────────────┘
   └──────────────────────────┘                      │
                                                     │ HTTPS (REST API)
                                                     ▼
                                     ┌───────────────────────────┐
                                     │     Google Gemini API     │
                                     │    (Gemini 3.5 Flash)     │
                                     └───────────────────────────┘
```

### Architectural Breakdown
1. **Frontend (Client Layer)**: React Native compiled via Expo SDK 54, utilizing React Native Reanimated v4, Animated API, and Expo Blur. The app is completely cross-platform, running on iOS, Android, and Web browsers.
2. **Backend (Application Layer)**: FastAPI (Python 3.11) running on Uvicorn. Implements JWT token-based authentication, password hashing, and parallel API routes.
3. **Database (Persistence Layer)**: Cloud PostgreSQL hosted on Neon, connected via SQLAlchemy ORM. Implements relational tables for `Users`, `MoodEntries`, and `ChatMessages` with automatic connection pooling.
4. **AI & ML Layer**: Deci-second API calls to HuggingFace for NLP sentiment and emotion classification, combined with contextually-injected conversational generation via Google Gemini.

---

## ✨ Key Features & User Experience (UX)
The application's interface is designed around a premium **deep space glassmorphic** theme, ensuring a calming, visually stunning, and smooth user experience:

- **Daily Sanctuary Check-In**: A highly interactive 5-step form where users track their mood (animated emoji slider), sleep hours, anxiety level (low/medium/high chips), physical activity, and write a free-text mind dump.
- **Empathetic AI Companion**: A beautiful messaging interface featuring quick suggestion chips, a smooth 3-dot animated typing indicator, and dynamic stress context badges.
- **Sanctuary Meditation & Breathing**: A specialized suite featuring color-coded breathing phases (Navy SEAL Box Breathing), an animated circular guide, and a celebratory emoji confetti burst on completion.
- **Analytics & History Hub**: A robust telemetry dashboard with a custom line/bar chart toggle, mood progression logs, and color-coded stress badges representing historical check-ins.
- **Wellness Advice Engine**: A dynamic hub that fetches stress-level-tailored advice cards featuring rich animations, swipeable gestures, and interactive checklists.

---

## 🤖 AI & Machine Learning Engine
MindGuard AI utilizes a hybrid AI system combining narrow NLP classification with general Generative AI.

```
                          ┌─────────────────────────┐
                          │    User Journal Text    │
                          └────────────┬────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     [Roberta Sentiment Model]                     [Go Emotions Model]
   Predicts Positive/Neutral/Negative              Predicts 28 Emotions
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       ▼
                           ┌────────────────────────┐
                           │   Stress Prediction    │
                           │   Weighted Ensemble    │
                           └───────────┬────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │   Gemini 3.5 Flash Chat      │
                        │ (Injected with Stress Level) │
                        └──────────────────────────────┘
```

### 1. Stress Prediction (4-Model NLP Ensemble)
The backend does not rely on a single classifier. Instead, it aggregates predictions from **four** highly specialized state-of-the-art NLP models to compute a weighted stress matrix:

| Model | Purpose | Architecture / Publisher | Weight |
|---|---|---|---|
| `twitter-roberta-base-sentiment-latest` | General Sentiment Analysis | Cardiff NLP (RoBERTa) | **25%** |
| `roberta-base-go_emotions` | Fine-grained Emotional Mapping | Sam Lowe (28-class RoBERTa) | **30%** |
| `emotion-english-distilroberta-base` | 7-Class Primary Emotion Classifier | J. Hartmann (DistilRoBERTa) | **25%** |
| `nli-deberta-v3-small` | Zero-shot Stress Natural Language Inference | Cross-Encoder (DeBERTa) | **20%** |

The ensemble evaluates the user's free-text journal. The output generates an overall **Stress Level (LOW, MODERATE, HIGH)** and an associated **Confidence Percentage** (e.g., *Moderate Stress, 94% Confidence*).

### 2. Context-Aware Chatbot (Gemini 3.5 Flash)
MindGuard AI uses **Gemini 3.5 Flash** as its primary conversational engine due to its exceptional speed, low latency, and warm tone. 

Every time a user sends a message, a background scheduler automatically builds a **User Wellness Context Block** containing their latest stats (mood score, sleep hours, anxiety levels, journal entries, and predicted stress levels) and injects it alongside a customized **System Prompt**. This forces the chatbot to provide hyper-personalized advice tailored to their exact state, preventing generic responses.

---

## 🛠️ Software Engineering & Bug Resolution Report
During development, six critical architectural and logic bugs were successfully resolved to achieve the final production-ready state:

### 1. React Hooks Map Violation (App Crash)
- **Problem**: In `AppNavigator.js`, `useSharedValue()` and `useAnimatedStyle()` hooks were called inside a `.map()` callback to generate the bottom tab items. This violated React's core rule: *Hooks cannot be called inside loops or conditional blocks*, causing sudden runtime crashes.
- **Resolution**: Extracted the tab items into their own individual, self-contained functional component (`TabItem`). The hooks are now called safely inside each component instance.

### 2. Bcrypt Decryption String Mismatch (Registration Failure)
- **Problem**: In `security.py`, `bcrypt.hashpw()` returned raw `bytes`, but the SQLite/PostgreSQL drivers required a UTF-8 `str` to save into the database columns, causing every user registration to crash.
- **Resolution**: Modified `get_password_hash()` to append `.decode('utf-8')` to the hashed output before writing to the database.

### 3. Missing `babel-preset-expo` (Metro Compiler Crash)
- **Problem**: The project referenced `babel-preset-expo` inside `babel.config.js`, but it was missing from `devDependencies` in `package.json`, causing the Metro bundler to crash on initial startup.
- **Resolution**: Installed `@babel/core` and aligned `babel-preset-expo` to the correct compatible SDK versions.

### 4. Expo SDK 54 Dependency Realignment (Core Crash)
- **Problem**: The project was using outdated dependencies that conflicted with the user's Expo Go version (**54.0.8**), causing the app to throw a red-screen error on startup:  
  `Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found.`
- **Resolution**: Cleaned `node_modules`, resolved duplicated `babel-preset-expo` entries, and ran `npx expo install --fix` to perfectly align React Native to `0.81.5`, React to `19.1.0`, and all other native packages to Expo SDK 54.

### 5. Android Modal Rendering & Visual Overlap Bug (UX Issue)
- **Problem**: On Android, the AI Stress Prediction modal was completely transparent, letting the questionnaire behind it bleed through and overlap, rendering the text illegible.
- **Resolution**: Redesigned the styling in `MoodTrackerScreen.js`. We set `modalBg` to a deep space dimming overlay (`rgba(5, 7, 16, 0.85)`) and overrode the `modalCard` background to a solid `#0D1226` to block out all underlying text while keeping the premium glassmorphic glow.

### 6. Ngrok Loopback Connection Timeout (Windows Network Issue)
- **Problem**: Starting Expo in tunnel mode on Windows threw the error: `CommandError: ngrok tunnel took too long to connect.` This was caused by Node 22 prioritizing IPv6 (`::1`), while ngrok was only listening on IPv4 (`127.0.0.1`).
- **Resolution**: Directed the Node.js compiler to prioritize IPv4 DNS resolutions first by configuring the shell environment:  
  `$env:NODE_OPTIONS="--dns-result-order=ipv4first"`.

---

## 🚀 Installation & Local Deployment Guide

### Prerequisites
- **Node.js**: Version **22 (LTS)** is highly recommended.
- **Python**: Version **3.11.x** (safest for machine learning libraries).
- **Git**

### 1. Backend Setup (Local)
1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder:
   ```env
   GEMINI_API_KEY=YOUR_NEW_GEMINI_KEY
   HF_API_KEY=YOUR_HUGGINGFACE_KEY
   DATABASE_URL=sqlite:///./data/mindguard.db
   SECRET_KEY=your-custom-jwt-signing-key
   ```
5. Launch the backend:
   ```powershell
   python run.py
   ```
   *(Backend will start running at **http://localhost:8000**)*

---

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Clean install the aligned SDK 54 dependencies:
   ```powershell
   npm install --legacy-peer-deps
   ```
3. Run the app in **LAN Mode** (if phone and laptop are on the same WiFi):
   ```powershell
   npx expo start --lan --clear
   ```
4. Run the app in **Tunnel Mode** (to share your app with any phone anywhere in the world):
   - First, save your free ngrok token:
     ```powershell
     npx ngrok authtoken <YOUR_TOKEN>
     ```
   - If using Node 22 on Windows, force IPv4 resolution in your terminal:
     ```powershell
     $env:NODE_OPTIONS="--dns-result-order=ipv4first"
     ```
   - Start the public tunnel:
     ```powershell
     npm run tunnel -- --clear
     ```
5. Scan the generated QR code using the **Expo Go** app on your phone!

---

## ☁️ Cloud Infrastructure & Scaling Plan
MindGuard AI is fully optimized for cloud deployment:

- **Frontend Deployment (EAS Build / Web)**: The web build can be hosted on Vercel or Netlify, while mobile APKs and IPAs can be generated and distributed using **Expo Application Services (EAS)**.
- **FastAPI Backend Hosting (Render)**: Hosted on a Render Web Service (`https://mindguard-ai-backend.onrender.com`). Render auto-deploys every commit pushed to the master branch and runs the service securely within a virtualized Docker container.
- **Serverless Relational Database (Neon PostgreSQL)**: Neon SQL provides serverless scaling and instant branching, keeping the database fast, responsive, and completely secure.

---

## 🔮 Conclusion & Future Roadmap
MindGuard AI successfully achieves its goal of being a **state-of-the-art, secure, and hyper-personalized mental health companion**. By shifting from generic advice to cognitively-aware, ML-predicted emotional mapping, the app provides a highly specialized and soothing personal sanctuary.

### 🗺️ Future Roadmap
1. **On-Device Local Inference**: Integrate React Native ONNX Runtime to run the 4-model stress ensemble directly on the phone's CPU/GPU, removing the need for outbound network requests completely.
2. **Biometric Core Integration**: Pull real-time heart rate variability (HRV) and sleep latency metrics from Apple HealthKit and Google Fit to automate the check-in process.
3. **Voice Guidance & Speech Analytics**: Integrate real-time speech sentiment analysis, allowing users to talk directly to MindGuard AI and get acoustic voice soothing.
