# TranslateApp 🌐🎙️

A robust, modular, and performant REST API for multilingual translation, dictionary enrichment, Text-to-Speech (TTS) audio synthesis, and translation history management built with **Node.js**, **Express**, and **MongoDB**.

---

## 🚀 Features

- **🌐 Multilingual Translation**: Translate between over 250 languages with automatic source language detection powered by Google Translate.
- **📚 Dictionary & Context Enrichment**: Look up word definitions, phonetics, parts of speech, synonyms, and contextual example sentences via Free Dictionary API.
- **🎙️ Text-to-Speech (TTS) Synthesis**: Generate audio pronunciation for original words, translated words, and contextual sentences.
- **⚡ Smart Audio Caching**: Caches generated MP3 files locally using MD5 hashing to eliminate redundant API calls, reduce latency, and avoid rate limiting.
- **📦 Batch Translation**: Translate multiple words and sentences concurrently in a single HTTP request.
- **🔍 Language Detection**: Automatically detect the source language of any given text.
- **🔐 User Authentication & Authorization**: Secure signup, login, email verification, and password reset flows with JWT and bcrypt.
- **⭐ History & Bookmarks**: Logged-in users can save translations to their personal history, toggle favorites, and search saved entries.
- **🛡️ Production Ready**: Equipped with Helmet security headers, CORS, Morgan request logging, rate limiting, and centralized error handling.
- **🔌 Graceful Database Degradation**: The core translation and TTS services work standalone even if MongoDB is temporarily unavailable.

---

## 📁 Project Architecture & Structure

```
translator/
├── config/
│   ├── db.js                     # MongoDB connection with graceful offline fallback
│   └── env.js                    # Environment variable validation & defaults
├── controllers/
│   ├── authController.js         # User registration, login, verification, password reset
│   ├── historyController.js      # User translation history & favorites management
│   └── translateController.js    # Translation, TTS, detection, batching, dictionary endpoints
├── data/
│   └── sampleTranslations.json   # Sample translation dataset
├── middlewares/
│   ├── auth.js                   # JWT verification & role-based route guard
│   ├── errorHandler.js           # Centralized JSON error formatting
│   └── notFound.js               # 404 handler
├── models/
│   ├── translation.js            # Mongoose schema for saved translations & bookmarks
│   └── user.js                   # Mongoose schema for user accounts & auth
├── routes/
│   ├── authRoutes.js             # /api/v1/auth routes
│   ├── historyRoutes.js          # /api/v1/history routes
│   └── translateRoutes.js        # /api/v1/translate routes
├── services/
│   ├── dictionaryService.js      # Word definitions, phonetics, and example sentences
│   ├── translateService.js       # Core translation, batching, and language detection
│   └── ttsService.js             # Google TTS generation and local MP3 disk caching
├── tests/
│   └── translate.test.js         # Automated test suite
├── utils/
│   ├── adminSeeder.js            # Initial admin account seeder
│   └── emailService.js           # Reusable email sender (verification & password reset)
├── audio/
│   ├── ar/                       # Sample Arabic audio files
│   ├── en/                       # Sample English audio files
│   └── cache/                    # Dynamically cached MP3 files (MD5-hashed)
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore rules
├── app.js                        # Express application configuration & middleware pipeline
├── package.json                  # Dependencies & npm scripts
├── server.js                     # Server entrypoint & graceful shutdown handlers
└── README.md                     # Documentation
```

---

## 🛠️ Prerequisites

- **Node.js** >= 18.0.0 (Tested on Node.js v26)
- **npm** >= 8.0.0
- **MongoDB** (Optional for basic translation; required for authentication and history features)

---

## 📦 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/mohnasr137/translator.git
cd translator
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port the HTTP server will listen on | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `API_URL` | Base path prefix for API endpoints | `/api/v1` |
| `MONGO_URI` | MongoDB connection string (Atlas or local) | — |
| `JWT_SECRET` | Secret key used to sign JWT tokens | `dev_secret...` |
| `JWT_EXPIRE` | Token validity duration | `30d` |
| `GMAIL_USER` | Gmail address for sending verification emails (optional) | — |
| `GMAIL_PASSWORD`| Gmail App Password (optional) | — |
| `ADMIN_EMAIL` | Initial admin email address (optional) | — |
| `ADMIN_PASSWORD`| Initial admin password (optional) | — |

> **Note**: If `MONGO_URI` is not provided or the database is offline, translation and TTS endpoints remain **100% operational**. Database-dependent endpoints (auth, history) will return a clear message.

### 3. Run the Application

**Development Mode (auto-restart on file change):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

**Run Automated Tests:**
```bash
npm test
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api/v1`

### 1. Translation Endpoints (`/api/v1/translate`)

#### • Translate Text / Sentence
Translates text, detects language automatically if unspecified, enriches single words with dictionary definitions and example sentences, and generates cached TTS audio files.

- **URL**: `POST /api/v1/translate`
- **Body**:
  ```json
  {
    "text": "computer",
    "from": "auto",
    "to": "ar",
    "includeAudio": true,
    "includeExample": true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "original": "computer",
      "translation": "حاسوب",
      "sourceLang": "en",
      "sourceLangName": "English",
      "targetLang": "ar",
      "targetLangName": "Arabic",
      "phonetic": "/kəmˈpjuː.tə/",
      "partOfSpeech": "noun",
      "definition": "A programmable electronic device that performs mathematical and logical operations.",
      "exampleOriginal": "She works on her computer every day.",
      "exampleTranslated": "إنها تعمل على جهاز الكمبيوتر الخاص بها كل يوم.",
      "audio": {
        "original": "/audio/cache/en-141c0211aacfe4dc.mp3",
        "translation": "/audio/cache/ar-fc633ace6c90d81b.mp3",
        "exampleOriginal": "/audio/cache/en-56a81b22e17c0a9d.mp3",
        "exampleTranslated": "/audio/cache/ar-92e10a71f054ba31.mp3"
      }
    }
  }
  ```

#### • Translate Single Word
- **URL**: `POST /api/v1/translate/word`
- **Body**:
  ```json
  {
    "word": "book",
    "source": "en",
    "target": "ar"
  }
  ```

#### • Batch Translation
Translate an array of texts in one request.
- **URL**: `POST /api/v1/translate/batch`
- **Body**:
  ```json
  {
    "texts": ["Hello", "Goodbye", "Thank you"],
    "from": "en",
    "to": "es"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      { "originalText": "Hello", "translatedText": "Hola", "targetLang": "es" },
      { "originalText": "Goodbye", "translatedText": "Adiós", "targetLang": "es" },
      { "originalText": "Thank you", "translatedText": "Gracias", "targetLang": "es" }
    ]
  }
  ```

#### • Detect Language
- **URL**: `POST /api/v1/translate/detect`
- **Body**:
  ```json
  { "text": "Bonjour tout le monde" }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "text": "Bonjour tout le monde",
      "detectedLanguage": "fr",
      "languageName": "French"
    }
  }
  ```

#### • List Supported Languages
- **URL**: `GET /api/v1/translate/languages`
- **Response**: List of 250+ supported language codes and their English display names.

#### • Text-to-Speech Direct Stream / URL
- **URL**: `GET /api/v1/translate/tts?text=Welcome&lang=en`
- **Query Params**:
  - `text`: Text to speak
  - `lang`: Language code (default: `en`)
  - `download`: Set `true` to redirect directly to the audio stream

#### • Sample Translations
- **URL**: `GET /api/v1/translate/samples`

---

### 2. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | Register a new user | No |
| `POST` | `/api/v1/auth/signin` | Log in and receive JWT token | No |
| `GET` | `/api/v1/auth/verify/:token` | Verify email address via URL token | No |
| `POST` | `/api/v1/auth/verify-code` | Verify email with 6-digit code | No |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset code via email | No |
| `POST` | `/api/v1/auth/verify-reset-code`| Verify 6-digit password reset code | No |
| `POST` | `/api/v1/auth/reset-password` | Set a new password | No |
| `GET` | `/api/v1/auth/me` | Get current logged-in user profile | **Yes** (Bearer Token) |

---

### 3. Translation History & Bookmarks (`/api/v1/history`)

*All history endpoints require the `Authorization: Bearer <TOKEN>` header.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/history` | Save a translation to user's history |
| `GET` | `/api/v1/history` | Get history with pagination (`?page=1&limit=20&search=cat`) |
| `GET` | `/api/v1/history/favorites` | Get all bookmarked favorite translations |
| `PATCH`| `/api/v1/history/:id/favorite` | Toggle favorite / bookmark status |
| `DELETE`| `/api/v1/history/:id` | Remove a translation from history |
| `DELETE`| `/api/v1/history` | Clear all user translation history |

---

## 🎙️ Audio Caching Architecture

When TTS audio is requested:
1. An MD5 hash is generated from `text`, `language`, and `speed`.
2. The service checks `audio/cache/{lang}-{hash}.mp3` on the local file system.
3. If cached, it immediately returns `/audio/cache/{lang}-{hash}.mp3` without touching the network.
4. If not cached, it fetches the audio stream from Google TTS once, persists it to disk, and serves it statically.
5. Static audio files are served through Express at `http://localhost:5000/audio/...`.

---

## 🧪 Running Tests

An automated test suite is included in `tests/translate.test.js`:

```bash
npm test
```

It validates:
- English-to-Arabic and Arabic-to-English translation
- Multi-string batch translation
- Language detection
- Supported language repository
- Dictionary definition and example lookup
- Audio synthesis and local MP3 disk caching

---

## 📄 License

This project is licensed under the **ISC License**.
