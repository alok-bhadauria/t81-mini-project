# SignFusion 🤟

## The Problem
Communication between the Deaf/Hard-of-Hearing (DHH) community and the hearing world often hits a massive roadblock. Most people don't know American Sign Language (ASL), and learning it takes years. While we have tools like Google Translate for spoken languages, there isn't a widely accessible, real-time translator that goes from spoken or written English directly into accurate grammatical ASL. This creates an invisible barrier in schools, workplaces, and daily life.

## The Solution
SignFusion bridges this gap by providing a real-time, browser-based pipeline that translates English text, live speech, or document uploads directly into 3D ASL animations. It doesn't just do a basic word-for-word swap; it actually breaks down the English language, understands the sentiment, restructures the grammar into true ASL syntax, and drives a live React-Three.js avatar on the screen. 

## Key Benefits
- **Real-Time Translation:** Converts microphone speech and typed text into 3D animations instantly.
- **Accurate ASL Grammar:** Rearranges English (Time-Topic-Comment) instead of just rendering literal, broken translations.
- **Micro-Expressions:** Determines the emotional sentiment of the text and applies appropriate facial animations to the avatar.
- **Accessibility:** Completely web-based. No heavy software downloads needed.

---

## Tech Stack

**Frontend**
- **React.js & Vite** for high-performance UI rendering
- **Tailwind CSS** for clean, responsive styling
- **Firebase Auth** for user session management
- **React-Three-Fiber / Three.js** to render and drive the 3D GLB ASL animations

**Backend**
- **FastAPI** for a lightning-fast, async Python backend
- **MongoDB** (via Motor) for storing translation history, users, and tasks
- **PySpellChecker & Regular Expressions** for iterative typo reduction
- **NLTK VADER** for raw sentiment analysis
- **SpaCy** for Part-Of-Speech tagging and lemmatization

---

## Architecture & Data Flow

When a user inputs text or speaks into the microphone, here is exactly what happens under the hood:

1. **Input:** The React frontend captures the string and POSTs it securely to the FastAPI backend.
2. **Purification:** Our custom Python pipeline catches typographical errors (e.g., "proceesingggg") and intelligently reduces them down to real words without destroying acronyms.
3. **Sentiment & NLP:** NLTK VADER assigns an emotional state to the sentence (Happy, Sad, Neutral). SpaCy chops the sentence into tokens, deletes useless filler words, and reduces verbs to their roots.
4. **ASL Reordering:** We force the surviving words into ASL structure. Time words go to the front. Adjectives move behind the nouns. 
5. **Animation Mapping:** The backend looks up the exact 3D `.glb` identifiers for both the emotion and the sequential hand gestures. If it finds a word it doesn't know, it dynamically falls back to finger-spelling it letter-by-letter.
6. **Output & Render:** The backend bundles these mapped API URLs and sends them back to React, which feeds them into a moving window queue to drive the 3D character on screen.

---

## Technical Details

This repository is split into two entirely independent environments to keep things clean. 

**Backend Structure:** `app/` contains the entire FastAPI mesh. `services/` holds our NLP translation logic broken down chronologically (`step0` to `step4`), making the pipeline extremely modular to debug. 
**Frontend Structure:** `src/` contains all the React views and components, state management for user sessions, and most importantly, the WebGL canvas handlers that render the avatar based on the backend's animation map.

---

## Setup & Installation

You need **Python (3.10+)** and **Node.js** installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/alok-bhadauria/t81-mini-project.git
cd t81-mini-project
```

### 2. Backend Setup
Navigate into the backend directory and set up your standalone Python environment:
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

**Environment Variables (.env)**
Create a `.env` file in the `backend/` directory. You will need:
```ini
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET_KEY="some_secure_random_string"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"
```

### 3. Frontend Setup
Open a new terminal, navigate into the frontend directory, and install the NPM packages:
```bash
cd frontend/t81-frontend
npm install
```

**Environment Variables (.env)**
Create a `.env` file in the `frontend/t81-frontend/` directory to hook up your API:
```ini
VITE_API_URL="http://127.0.0.1:8000/api/v1"
```

*(Note: You'll also need to configure Firebase in `AuthContext.jsx` if you want Google Login to work).*

---

## How to Run the Application

You need to run both servers simultaneously in two separate terminal windows.

**Running the Backend (Terminal 1)**
```bash
cd backend
# Make sure your Python venv is activated!
uvicorn app.main:app --reload
```
The FastAPI server will boot up at `http://127.0.0.1:8000`.

**Running the Frontend (Terminal 2)**
```bash
cd frontend/t81-frontend
npm run dev
```
The React development server will start, typically at `http://localhost:5173`. Open this URL in your browser to access the application.

---

## Disclaimer & References
*This project was built as an experimental translation pipeline. While the ASL grammatical reordering and NLP engines are highly advanced, ASL is a massively complex, visual-spatial language that relies heavily on context and expression. Translating English text strictly into 3D animations currently serves as an educational accessibility bridge, not a complete substitute for native ASL interpretation.*
