# Distill — AI Flashcard Generator

## Project Overview

Distill is an AI-powered flashcard generator. Users paste text, and the app uses the Claude API to generate a set of flashcards (front/back pairs) from that content. Users can save decks, organize flashcards, and study them using a simple flip card interface.

**Core user flow:**
1. User pastes text into the app
2. Claude API generates flashcards from the content
3. User reviews, saves, and studies the flashcards

**Planned future features (not in v1):**
- PDF upload → flashcards (pdfplumber)
- YouTube URL → flashcards (youtube-transcript-api)

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + TypeScript | Vite for tooling |
| Data fetching | TanStack Query (React Query) | All API calls go through query/mutation hooks |
| Backend | Django + Django REST Framework | Python 3.11+ |
| Auth | SimpleJWT | JWT access + refresh tokens |
| Database | PostgreSQL | Hosted on Railway |
| AI | Claude API (Haiku 4.5) | Used for flashcard generation only |
| Deployment (FE) | Vercel | |
| Deployment (BE) | Railway | Also hosts PostgreSQL |

---

## Project Structure

```
distill/
├── frontend/                  # React + TypeScript app
│   ├── src/
│   │   ├── api/               # Axios instance + API call functions
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # TanStack Query hooks (useDecks, useGenerateCards, etc.)
│   │   ├── pages/             # Page-level components (Home, Deck, Study, Login)
│   │   ├── types/             # TypeScript interfaces and types
│   │   └── utils/             # Helper functions
│   ├── .env.local             # VITE_API_URL
│   └── package.json
│
└── backend/                   # Django project
    ├── distill/               # Django project settings
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── apps/
    │   ├── users/             # Custom user model, auth endpoints
    │   ├── decks/             # Deck and Flashcard models, CRUD endpoints
    │   └── ai/                # Claude API integration, flashcard generation endpoint
    ├── requirements.txt
    └── manage.py
```

---

## Data Models

### User
Standard Django user model extended with SimpleJWT auth.

### Deck
```
id            UUID (primary key)
user          FK → User
title         CharField
description   TextField (optional)
created_at    DateTimeField
updated_at    DateTimeField
```

### Flashcard
```
id            UUID (primary key)
deck          FK → Deck
front         TextField
back          TextField
order         IntegerField
created_at    DateTimeField
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register/        Register new user
POST   /api/auth/login/           Obtain JWT token pair
POST   /api/auth/token/refresh/   Refresh access token
```

### Decks
```
GET    /api/decks/                List user's decks
POST   /api/decks/                Create new deck
GET    /api/decks/:id/            Get deck with its flashcards
PUT    /api/decks/:id/            Update deck
DELETE /api/decks/:id/            Delete deck
```

### Flashcards
```
POST   /api/decks/:id/cards/      Add a card to a deck
PUT    /api/cards/:id/            Update a card
DELETE /api/cards/:id/            Delete a card
```

### AI Generation
```
POST   /api/generate/             Generate flashcards from text
                                  Body: { text: string, deck_id?: string }
                                  Returns: [{ front: string, back: string }]
```

---

## Auth Flow

- Register/login returns `access` and `refresh` JWT tokens
- Frontend stores tokens in memory (not localStorage)
- Access token sent as `Authorization: Bearer <token>` header on all protected requests
- TanStack Query handles token refresh automatically via axios interceptor
- All `/api/` endpoints except `/api/auth/` require authentication

---

## Claude API Integration

- Model: `claude-haiku-4-5` (fast and cheap, sufficient for flashcard generation)
- Integration lives entirely in `apps/ai/`
- The system prompt instructs Claude to return flashcards as a JSON array
- Response format: `[{"front": "...", "back": "..."}, ...]`
- Always parse and validate the JSON response before returning to the client
- Keep the system prompt in a separate `prompts.py` file, not hardcoded in views

### Example system prompt structure:
```
You are a flashcard generator. Given a piece of text, generate clear and concise flashcards.
Each flashcard should have a "front" (question or concept) and a "back" (answer or explanation).
Return ONLY a JSON array of objects with "front" and "back" keys. No other text.
```

---

## Frontend Conventions

- All API calls go through custom TanStack Query hooks in `src/hooks/`
- Never call axios directly in components — always use hooks
- TypeScript strict mode enabled — no `any` types
- Components should be small and focused — split early
- Use `src/types/index.ts` for all shared TypeScript interfaces
- Tailwind CSS for styling

---

## Backend Conventions

- Use class-based views (APIView or ViewSet) — not function-based views
- All views must use `IsAuthenticated` permission class unless explicitly public
- Use serializers for all input validation — never trust raw request.data
- UUIDs as primary keys for all models
- Environment variables via `django-environ`, never hardcode secrets
- Keep business logic out of views — use service functions in a `services.py` file per app

---

## Environment Variables

### Backend (.env)
```
SECRET_KEY=
DEBUG=False
DATABASE_URL=
ANTHROPIC_API_KEY=
ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
```

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## What NOT To Do

- **Don't use localStorage for tokens** — store in memory only (security)
- **Don't use function-based views** in Django — use class-based views
- **Don't hardcode the Claude model string** — keep it in settings/config so it's easy to swap
- **Don't return raw Claude API responses** to the frontend — always parse and validate first
- **Don't use `any` in TypeScript** — define proper types
- **Don't put business logic in Django views** — use service functions
- **Don't call the Claude API on every keystroke** — generation is only triggered on explicit user action
- **Don't use Django templates** — this is an API-only backend, all rendering is in React
- **Don't add PDF or YouTube features in v1** — keep scope tight, ship first

---

## Current Status

Starting from scratch. v1 scope:
- [ ] Django project setup + PostgreSQL connection
- [ ] User registration and JWT auth
- [ ] Deck CRUD
- [ ] Flashcard CRUD
- [ ] Claude API integration (text → flashcards)
- [ ] React frontend with auth flow
- [ ] Deck management UI
- [ ] Flashcard generation UI
- [ ] Flip card study mode
- [ ] Deploy to Railway + Vercel
