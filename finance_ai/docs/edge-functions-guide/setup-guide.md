# Edge Functions Setup Guide — Manual Creation in Supabase

This guide walks you through manually creating the two AI-powered edge functions used in TaxSathi:

1. **`analyze-document`** — Extracts structured financial data from uploaded documents
2. **`tax-analysis`** — Runs full tax regime comparison and provides deduction/scheme suggestions

---

## Prerequisites

Before creating edge functions, ensure:

- You have a Supabase project (note your **Project ID**, **Anon Key**, and **Service Role Key**)
- You have the **LOVABLE_API_KEY** stored as a secret (this authenticates calls to the Lovable AI Gateway)
- Your database has these tables: `documents`, `financial_data`, `tax_analyses`, `profiles`
- The storage bucket `tax-documents` exists

---

## Step 1: Add Required Secrets

1. Go to **Supabase Dashboard → Project Settings → Edge Functions → Secrets**
2. Add the following secret:
   - **Name:** `LOVABLE_API_KEY`
   - **Value:** Your Lovable AI gateway API key

> `SUPABASE_URL` and `SUPABASE_ANON_KEY` are automatically available in all edge functions.

---

## Step 2: Create the `analyze-document` Edge Function

### Option A: Using Supabase CLI

```bash
supabase functions new analyze-document
```

Then replace the contents of `supabase/functions/analyze-document/index.ts` with the code from `ai-prompts.md`.

Deploy:
```bash
supabase functions deploy analyze-document --no-verify-jwt
```

### Option B: Using Supabase Dashboard

1. Go to **Supabase Dashboard → Edge Functions**
2. Click **"New Function"**
3. Name it: `analyze-document`
4. Paste the full code from the **analyze-document** section in `ai-prompts.md`
5. Click **Deploy**

### Option C: Using Supabase AI Assistant (recommended for beginners)

1. Go to **Supabase Dashboard → Edge Functions**
2. Click **"Create a new function"** or open the **AI Assistant**
3. Use the prompt from `ai-prompts.md` → Section: **"Prompt for Supabase AI: analyze-document"**
4. Review the generated code, then click **Deploy**

---

## Step 3: Create the `tax-analysis` Edge Function

Follow the same process as Step 2, but use:
- Function name: `tax-analysis`
- Code/prompt from the **tax-analysis** section in `ai-prompts.md`

---

## Step 4: Configure `config.toml` (if using CLI)

In your `supabase/config.toml`, add:

```toml
[functions.analyze-document]
verify_jwt = false

[functions.tax-analysis]
verify_jwt = false
```

> We set `verify_jwt = false` because JWT validation is handled inside the function code itself (using `supabase.auth.getUser()`).

---

## Step 5: Test the Edge Functions

### Test `analyze-document`

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/analyze-document \
  -H "Authorization: Bearer <USER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -d '{
    "documentId": "some-uuid",
    "fileContent": "Gross Salary: 1200000, TDS Deducted: 50000, PF: 21600",
    "fileName": "form16.txt"
  }'
```

### Test `tax-analysis`

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/tax-analysis \
  -H "Authorization: Bearer <USER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -d '{
    "financialData": {
      "gross_salary": 1200000,
      "deductions_80c": 150000,
      "deductions_80d": 25000,
      "deductions_nps": 50000,
      "financial_year": "2025-26"
    },
    "profile": {
      "employment_type": "salaried",
      "age_group": "below-60",
      "income_sources": ["salary"],
      "tax_regime": "new"
    }
  }'
```

---

## Step 6: Connect from Frontend

Call edge functions using the Supabase JS client:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Analyze a document
const { data, error } = await supabase.functions.invoke("analyze-document", {
  body: { documentId, fileContent, fileName }
});

// Run tax analysis
const { data, error } = await supabase.functions.invoke("tax-analysis", {
  body: { financialData, profile }
});
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `LOVABLE_API_KEY not configured` | Add the secret in Dashboard → Edge Functions → Secrets |
| `401 Unauthorized` | Ensure you're passing a valid JWT in the Authorization header |
| `429 Too Many Requests` | Rate limited — wait and retry, or upgrade your plan |
| `402 Payment Required` | AI credits exhausted — add credits in Lovable workspace settings |
| CORS errors | Ensure the CORS headers are included (see the code) |
| Function not found | Check the function name matches exactly, redeploy if needed |

---

## Architecture Overview

```
Frontend (React)
    │
    ├── Auth (direct Supabase JS client)
    │
    └── Data Operations (Go backend proxy)
            │
            └── Calls Edge Functions for AI:
                    ├── analyze-document → Lovable AI Gateway → Gemini
                    └── tax-analysis    → Lovable AI Gateway → Gemini
```

Both edge functions use the **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) with the `google/gemini-3-flash-preview` model and **function calling** (tool use) to extract structured JSON responses.
