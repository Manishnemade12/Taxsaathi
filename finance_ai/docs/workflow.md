# TaxSathi Workflow Documentation

## 1) Project Architecture

This project has 4 layers:

1. **Frontend (React + Vite)**
   - Path: `src/`
   - Handles UI, auth state, and API calls.
2. **Backend API (Go + Chi)**
   - Path: `backend/`
   - Validates JWT and proxies DB/storage/function operations to Supabase.
3. **Supabase (Auth + Postgres + Storage)**
   - Path: `supabase/migrations/`
   - Stores users, profiles, financial data, documents, and analyses.
4. **Supabase Edge Functions (AI workflows)**
   - Path: `supabase/functions/`
   - `analyze-document`: extracts structured financial data from uploaded files.
   - `tax-analysis`: computes regime comparison, deductions, and scheme recommendations.

---

## 2) Environment Configuration

## Frontend (`.env`)
Required keys:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL` (usually `http://localhost:8080`)

## Backend (`backend/.env`)
Required keys:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PORT` (default `8080`)
- `FRONTEND_URL` (used in CORS allowlist)

## Edge Functions secrets (Supabase project)
Required key:

- `LOVABLE_API_KEY`

---

## 3) Local Development Workflow

### Step A: Install frontend dependencies

```bash
cd csv-mongo-dreams
npm install
```

### Step B: Start backend

```bash
cd backend
go run .
```

Expected startup log:

```text
🚀 TaxSathi Backend running on :8080
```

### Step C: Start frontend

```bash
cd ..
npm run dev -- --host 0.0.0.0 --port 5173
```

Expected startup log includes:

- `Local: http://localhost:5173/`

### Step D: Health checks

Backend:

```bash
curl http://localhost:8080/health
```

Expected:

```json
{"status":"ok"}
```

Frontend (HTTP only):

```bash
curl -I http://localhost:5173/
```

---

## 4) Request/Auth Workflow

1. User signs in via Supabase Auth in frontend.
2. Frontend gets session token (`access_token`).
3. Frontend API client (`src/lib/api.ts`) sends `Authorization: Bearer <jwt>` to Go backend.
4. Backend middleware (`backend/middleware/auth.go`) validates JWT via Supabase Auth API.
5. Backend injects `user_id`, `email`, and `jwt` into request context.
6. Handlers call Supabase REST/Storage/Functions via `backend/services/supabase.go`.

If token is missing or invalid, backend returns `401`.

---

## 5) Feature Workflows

## A) Onboarding + Profile

- Frontend sends onboarding payload to `POST /api/onboarding/complete`.
- Backend updates `profiles` and creates/initializes `financial_data` for FY `2025-26`.

## B) Document Upload + Analysis

1. Frontend uploads file to `POST /api/documents/upload`.
2. Backend uploads to Supabase Storage bucket `tax-documents`.
3. Backend inserts metadata row in `documents` table.
4. Frontend triggers `POST /api/documents/{id}/analyze`.
5. Backend downloads content and calls edge function `analyze-document`.
6. Edge function extracts structured fields and updates `documents.extracted_data` + status.

## C) Tax Analysis

1. Frontend sends financial/profile data to `POST /api/tax-analysis/run`.
2. Backend updates `financial_data`.
3. Backend invokes edge function `tax-analysis`.
4. Edge function returns old/new regime tax, suggestions, schemes, summary.
5. Result is upserted into `tax_analyses` and returned to frontend.

## D) Dashboard + Schemes

- Dashboard endpoint aggregates document count, income totals, estimated tax, and savings.
- Schemes endpoint reads recommendations from latest tax analysis.
- Personalized schemes re-trigger the tax-analysis edge function with current profile + financial data.

---

## 6) Database Workflow

Primary migration is in:

- `supabase/migrations/20260227184500_consolidated_schema.sql`

Core tables:

- `profiles`
- `documents`
- `financial_data`
- `tax_analyses`

RLS policies are enabled for per-user access control.

---

## 7) Common Troubleshooting

## Backend won’t start (`bind: address already in use`)

- Port 8080 is already occupied.
- Find process: `ss -ltnp | grep :8080`
- Kill process, then restart backend.

## Frontend works but API calls fail with auth errors

- Check login/session in browser.
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Verify backend receives Authorization header.

## Browser shows `NetworkError` / CORS-looking error for API calls

If backend is healthy and CORS preflight is `200`, this is often actually **Supabase unreachable**:

```bash
curl --max-time 8 https://<project-ref>.supabase.co/auth/v1/health
```

If this times out, network is blocking Supabase access (VPN/proxy/firewall/ISP path).

## CORS check

Backend allows localhost origins by default and `FRONTEND_URL` for non-local origins.

---

## 8) API Surface (Current)

All routes below require auth except `/health`.

- `GET /health`
- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/onboarding/complete`
- `GET /api/documents`
- `POST /api/documents/upload`
- `DELETE /api/documents/{id}`
- `POST /api/documents/{id}/analyze`
- `GET /api/financial-data`
- `PUT /api/financial-data`
- `GET /api/tax-analysis`
- `POST /api/tax-analysis/run`
- `GET /api/dashboard/stats`
- `GET /api/schemes`
- `POST /api/schemes/personalized`

---

## 9) Recommended Team Workflow

1. Pull latest changes.
2. Run both servers locally.
3. Validate `/health` and sign-in flow first.
4. Test one full user journey:
   - signup/signin → onboarding → upload doc → analyze doc → run tax analysis.
5. If API failures occur, verify Supabase reachability before changing backend code.
