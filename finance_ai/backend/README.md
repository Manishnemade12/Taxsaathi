# Express Backend Migration

This folder now contains the Node.js and Express backend that mirrors the original Go API.

## Run

1. Install backend dependencies:

```sh
cd backend
npm install
```

2. Start the backend:

```sh
npm run dev
```

## Environment

Required variables:

- `PORT` - defaults to `8080`
- `FRONTEND_URL` - allowed CORS origin for production
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL` - optional, defaults to `llama-3.3-70b-versatile`

## API Surface

The Express server preserves the same routes used by the frontend:

- `GET /health`
- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/onboarding/complete`
- `GET /api/documents`
- `POST /api/documents/upload`
- `DELETE /api/documents/:id`
- `POST /api/documents/:id/analyze`
- `GET /api/financial-data`
- `PUT /api/financial-data`
- `GET /api/tax-analysis`
- `POST /api/tax-analysis/run`
- `POST /api/taxbuddy/strategy`
- `POST /api/taxbuddy/live/start`
- `POST /api/taxbuddy/live/message`
- `GET /api/dashboard/stats`
- `GET /api/schemes`
- `POST /api/schemes/personalized`
