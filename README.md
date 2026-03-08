SignFusion

SignFusion is a full-stack platform designed to process continuous text or speech inputs and translate them into American Sign Language grammar and sequences. The project utilizes a decoupled architecture, relying on a Python backend for Natural Language Processing and a React frontend for user interaction.

Architecture Overview

The platform is split into two primary components:

Backend (FastAPI)
The backend service routes requests, validates input schemas via Pydantic, and orchestrates the NLP translation pipelines. It is built on Python and interfaces directly with a MongoDB cluster.
- Core Framework: FastAPI
- Database: MongoDB via Motor (AsyncIO)
- Authentication: JWT Bearer Tokens and Bcrypt Password Hashing
- NLP Engine: Custom tokenizer and sentiment analyzer
- Rate Limiting: SlowAPI

Frontend (React)
The client interface provides user authentication, historical translation logs, account management, and the core translation environment.
- Core Framework: React + Vite
- Styling: Tailwind CSS v4
- Routing: React Router DOM
- Icons: Lucide React

Prerequisites

To run this project locally, ensure the following tools are installed:
- Node.js (v18 or higher)
- npm (v9 or higher)
- Python (v3.10 or higher)
- A running MongoDB instance (Local or Atlas)

Environment Configuration

Both the frontend and backend require environment variable files to start.

Backend (.env)
Create a .env file in the /backend directory with the following keys:
MONGODB_URI
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
JWT_SECRET_KEY
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES

Frontend (.env.local)
Create a .env.local file in the /frontend/t81-frontend directory with the following keys:
VITE_API_URL
VITE_GOOGLE_CLIENT_ID

Local Setup Instructions

1. Clone the repository and navigate into the root directory.

2. Start the Backend Server
Navigate into the backend folder:
cd backend
Create and activate a virtual environment:
python -m venv venv
venv\Scripts\activate
Install dependencies:
pip install -r requirements.txt
Start the FastAPI server:
uvicorn app.main:app --reload
The backend will run on port 8000.

3. Start the Frontend Server
Open a new terminal and navigate into the frontend folder:
cd frontend/t81-frontend
Install dependencies:
npm install
Start the development server:
npm run dev
The frontend will run on port 5173.

Security Layers

The platform incorporates several security features natively:
- Cross-Origin Resource Sharing is strictly typed to the local development ports.
- Password strings are hashed using the Passlib Bcrypt generator.
- Authentication relies on stateless JSON Web Tokens.
- The backend utilizes SlowAPI to rate limit translation and authentication endpoints.
- Global HTTP middleware enforces XSS-Protection, HSTS, and X-Content-Type-Options headers.
- Input validation is handled via Pydantic schema typing.
