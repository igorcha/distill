# Distill — AI Flashcard Generator

## Project Overview

Distill is an AI-powered flashcard generator. Users can paste text, upload a PDF, or provide a YouTube URL, and the app uses the Claude API to generate a set of flashcards (front/back pairs) from that content. Users can save decks, organize flashcards, and study them using a flip card interface.

**Core user flows:**
1. User pastes text, uploads a PDF, or provides a YouTube URL
2. Content is extracted (if PDF/YouTube) and sent to the Claude API
3. Claude generates flashcards from the content
4. User reviews, saves, and studies the flashcards

**Credit system:** Each generation costs credits (1 for text/PDF, 3 for YouTube). Free tier gets 10 credits/month, Pro tier gets 200 credits/month. Resets on calendar month basis.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19 + TypeScript | Vite 7 for tooling |
| UI | Radix UI + shadcn/ui + Tailwind CSS 4 | With Framer Motion for animations |
| Data fetching | TanStack Query v5 (React Query) | All API calls go through query/mutation hooks |
| Backend | Django 6 + Django REST Framework | Python 3.11+ |
| Auth | SimpleJWT | JWT access + refresh tokens |
| Database | PostgreSQL | Hosted on Railway |
| Cache | Redis via django-redis | Used for rate limiting backend |
| Rate limiting | django-ratelimit | Per-user limits on extraction endpoints |
| AI | Claude API (Haiku 4.5) | Used for flashcard generation only |
| PDF extraction | pypdf | Text-only extraction, no OCR |
| YouTube transcripts | youtube-transcript-api | Auto-generated captions supported |
| Deployment (FE) | Vercel | |
| Deployment (BE) | Railway | Also hosts PostgreSQL and Redis |

---

## Project Structure

```
distill/
├── frontend/                  # React + TypeScript app
│   ├── src/
│   │   ├── api/               # Axios instance + API call functions
│   │   ├── components/        # Reusable UI components (shadcn/ui based)
│   │   ├── hooks/             # TanStack Query hooks (useDecks, useGenerateCards, etc.)
│   │   ├── pages/             # Page-level components (Home, Deck, Study, Login, Generate)
│   │   ├── types/             # TypeScript interfaces and types
│   │   └── utils/             # Helper functions
│   ├── .env.local             # VITE_API_URL
│   └── package.json
│
└── backend/                   # Django project
    ├── distill/               # Django project settings
    │   ├── settings.py
    │   ├── exceptions.py      # Global DRF exception handler (rate limit → 429)
    │   ├── urls.py
    │   └── wsgi.py
    ├── apps/
    │   ├── users/             # Custom user model, UserProfile, auth endpoints
    │   ├── decks/             # Deck and Flashcard models, CRUD endpoints
    │   └── ai/                # Claude API integration, PDF/YouTube extraction, generation
    ├── requirements.txt
    └── manage.py
```

---

## Data Models

### User
Custom user model (`AbstractBaseUser`) with email as the username field. Fields: `id` (UUID), `email`, `first_name`, `last_name`, `is_active`, `is_staff`, `created_at`.

### UserProfile
Auto-created via `post_save` signal on User creation. One-to-one relationship with User (`related_name="profile"`).
```
user                  OneToOne → User
tier                  CharField (choices: "free", "pro", default: "free")
monthly_credits_used  IntegerField (default: 0)
last_reset            DateField (auto_now_add)
stripe_customer_id    CharField (nullable)
subscription_id       CharField (nullable)
```

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
GET    /api/auth/me/              Get current user info
GET    /api/auth/profile/         Get user profile (tier, credits used, credits limit)
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
POST   /api/decks/:id/cards/bulk/ Bulk add cards to a deck
GET    /api/cards/:id/            Get a card
PUT    /api/cards/:id/            Update a card
PATCH  /api/cards/:id/            Partial update a card
DELETE /api/cards/:id/            Delete a card
```

### Content Extraction
```
POST   /api/extract/pdf/          Extract text from a PDF file
                                  Body: multipart form with "pdf" file
                                  Returns: { total_pages, extracted_pages, pages[], truncated, suggested_start_page }
                                  Rate limit: 30/hour per user

POST   /api/extract/youtube/      Extract transcript from a YouTube video
                                  Body: { url: string, start_seconds?: int, end_seconds?: int }
                                  Returns: { video_id, total_duration_seconds, needs_segmentation, minutes[], text, char_count }
                                  Rate limit: 10/hour per user
```

### AI Generation
```
POST   /api/generate/             Generate flashcards from text
                                  Body: { text: string, input_type: "text" | "pdf" | "youtube" }
                                  Returns: [{ front: string, back: string }]
                                  Credits: 1 for text/pdf, 3 for youtube
```

---

## Auth Flow

- Register/login returns `access` and `refresh` JWT tokens
- Frontend stores tokens in memory (not localStorage)
- Access token sent as `Authorization: Bearer <token>` header on all protected requests
- TanStack Query handles token refresh automatically via axios interceptor
- All `/api/` endpoints except `/api/auth/` require authentication

---

## Credit System

- Credits are tracked on the `UserProfile` model
- Costs: text/PDF generation = 1 credit, YouTube generation = 3 credits
- Free tier: 10 credits/month, Pro tier: 200 credits/month
- Monthly reset: credits reset to 0 when the calendar month changes (checked on each generation request)
- Credit check and deduction happens in `apps/ai/services.py` → `check_and_deduct_credits()`
- Exceeding the limit raises `PermissionDenied("Monthly credit limit reached.")`

---

## Rate Limiting

- PDF extraction: 30 requests/hour per user
- YouTube extraction: 10 requests/hour per user
- Implemented via `django-ratelimit` decorators on views with `block=True`
- Backed by Redis cache (`django-redis`)
- When rate limited, `django_ratelimit.exceptions.Ratelimited` is caught by the global DRF exception handler in `distill/exceptions.py` and returns a 429 response

---

## Claude API Integration

- Model: `claude-haiku-4-5` (configured as `CLAUDE_MODEL` in settings)
- Integration lives entirely in `apps/ai/`
- The system prompt instructs Claude to return flashcards as a JSON array
- Response format: `[{"front": "...", "back": "..."}, ...]`
- Always parse and validate the JSON response before returning to the client
- Keep the system prompt in a separate `prompts.py` file, not hardcoded in views
- JSON parsing has 3 fallback strategies: direct parse → strip markdown fences → regex extract

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
REDIS_URL=redis://127.0.0.1:6379/1
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

Requires Redis running locally for rate limiting (default: `redis://127.0.0.1:6379/1`).

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

---

## Current Status

### Done
- [x] Django project setup + PostgreSQL connection
- [x] Custom user model with email auth
- [x] User registration and JWT auth
- [x] User profile with credit system (auto-created via signal)
- [x] Deck CRUD
- [x] Flashcard CRUD (including bulk create)
- [x] Claude API integration (text → flashcards)
- [x] PDF upload → text extraction → flashcards
- [x] YouTube URL → transcript extraction → flashcards
- [x] Credit system (free/pro tiers, monthly reset)
- [x] Rate limiting on extraction endpoints (Redis-backed)
- [x] Global DRF exception handler for rate limits
- [x] React frontend with auth flow
- [x] Deck management UI
- [x] Flashcard generation UI (text, PDF, YouTube)
- [x] Flip card study mode

### Remaining
- [ ] Stripe billing integration (pro tier subscriptions)
- [ ] Settings page
- [ ] Landing page
- [ ] Deploy to Railway + Vercel
