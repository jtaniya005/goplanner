# GoPlanner

AI-powered day-trip planner. Expo (React Native) app + Node/Express/MongoDB backend,
using a Hugging Face LLM to generate itineraries.

## What's here

- **`backend/`** — Express API: auth (JWT + bcrypt), trip CRUD, AI itinerary generation.
- **`app/`, `components/`, `context/`, `lib/`** — the Expo app.

## Features

- AI-generated day-by-day itineraries from destination, day count, and preferences.
- **Budget-aware planning** — set a budget and the AI automatically revises the plan
  once if it comes in over.
- **"Explain this pick"** — every activity includes a one-line reason it was chosen.
- **Weather-aware re-planning** — checks the real forecast (Open-Meteo, no API key
  needed) for your trip dates, flags outdoor activities at risk, and can swap a
  single activity via AI (bad weather / closed / just want something else).
- **Offline export** — download the itinerary as an `.ics` calendar file or a PDF.

## 1. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env`:

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | yes | e.g. `mongodb://127.0.0.1:27017` for local Mongo, or an Atlas URI |
| `DB_NAME` | no | defaults to `goplanner` |
| `JWT_SECRET` | yes in production | a long random string |
| `HF_API_KEY` | yes | Hugging Face token — get one at https://huggingface.co/settings/tokens |
| `HF_MODEL` | no | defaults to `moonshotai/Kimi-K2-Instruct-0905` |
| `CORS_ORIGIN` | no | comma-separated allowed origins, defaults to `*` |

Run it:

```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```

Health check: `GET http://localhost:3000/health`

### API overview

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                                    (auth required)

GET    /api/trips                                       (auth required)
POST   /api/trips                                       { destination, days, budget?, description?, startDate? }
GET    /api/trips/:id
PUT    /api/trips/:id
DELETE /api/trips/:id
POST   /api/trips/:id/days/:day/activities/:index/replan   { reason: "weather" | "closed" | "other" }
POST   /api/trips/:id/weather/refresh
GET    /api/trips/:id/export/ics
GET    /api/trips/:id/export/pdf
```

## 2. App setup

From the project root:

```bash
npm install
```

Point the app at your backend by setting `EXPO_PUBLIC_API_URL`. Create a `.env` at
the project root (Expo reads `EXPO_PUBLIC_*` vars automatically):

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

If you're testing on a physical device or a simulator that can't reach
`localhost`, use your machine's LAN IP instead, e.g. `http://192.168.1.20:3000`.

Run it:

```bash
npx expo start
```

## Project structure

```
backend/
  src/
    app.js                  entrypoint
    config/                 env + db connection
    models/                 User, Trip (Mongoose)
    middleware/              auth, rate limiting, error handling
    controllers/              auth, trips, export
    routes/
    lib/
      aiClient.js            Hugging Face calls + JSON parsing/repair
      weatherClient.js       Open-Meteo geocoding + forecast
      icsBuilder.js           .ics calendar generation
      pdfBuilder.js           PDF export

app/
  login/index.tsx            login + register
  (tabs)/
    dashboard.tsx             trip list
    trip-planner.tsx          create-trip form
    profile.tsx
  trip/[id].tsx               itinerary detail — budget bar, weather check,
                               per-activity re-plan, export
context/AuthContext.tsx        auth state + token storage (expo-secure-store)
lib/api.ts                     typed API client
```

## Notes on what changed from the original version

The original prototype had a few issues fixed in this rebuild:
- Several backend files imported from paths that didn't exist (e.g.
  `../../../src/model/User.js`), so the server couldn't actually start.
- Login/profile were hardcoded to fake credentials with no real backend calls.
- No rate limiting on the AI endpoint, no input validation, and an insecure
  default JWT secret with no production guard.
- Two overlapping AI client files doing the same job — consolidated into one.
