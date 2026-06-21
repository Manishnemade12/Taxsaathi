# AI Prompts & Full Code for Edge Functions

Use these prompts with the **Supabase AI Assistant** to generate the edge functions, or copy the code directly.

---

## 1. analyze-document

### Prompt for Supabase AI Assistant

Copy and paste this entire prompt into the Supabase AI assistant when creating the `analyze-document` edge function:

---

> **Prompt:**
>
> Create a Deno edge function called `analyze-document` that does the following:
>
> 1. Handle CORS preflight (OPTIONS) requests. Use these CORS headers:
>    ```
>    Access-Control-Allow-Origin: *
>    Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
>    ```
>
> 2. Extract the `Authorization` header from the request. If missing, return error.
>
> 3. Create a Supabase client using `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars, passing the Authorization header.
>
> 4. Authenticate the user using `supabase.auth.getUser()`. If unauthorized, return error.
>
> 5. Parse the JSON body to get: `documentId` (string), `fileContent` (string), `fileName` (string).
>
> 6. Read the `LOVABLE_API_KEY` secret from environment. If not set, return error.
>
> 7. Call the AI gateway at `https://ai.gateway.lovable.dev/v1/chat/completions` with:
>    - Method: POST
>    - Headers: `Authorization: Bearer ${LOVABLE_API_KEY}`, `Content-Type: application/json`
>    - Model: `google/gemini-3-flash-preview`
>    - System prompt: "You are a financial document analyzer for Indian taxpayers. Extract structured financial data from the provided document content. Return a JSON object with these fields (use 0 for missing values): document_type (string like 'Form 16', 'Salary Slip', etc.), employer_name (string or null), financial_year (string like '2025-26'), gross_salary (number), hra_received (number), lta_received (number), other_income (number), deductions_80c (number for PPF/ELSS/LIC), deductions_80d (number for health insurance), deductions_80e (number for education loan interest), deductions_80g (number for donations), deductions_nps (number), professional_tax (number), tds_deducted (number), key_findings (string array of important observations). Be thorough in extracting all financial figures."
>    - User message: `Analyze this document (${fileName}):\n\n${fileContent}`
>    - Use function calling (tools) with a function named `extract_financial_data` that has parameters matching all the fields above. Set `tool_choice` to force this function.
>
> 8. Handle error responses: return 429 for rate limits ("Rate limit exceeded. Please try again in a moment."), 402 for payment required ("AI credits exhausted. Please add credits."), and generic 500 for other errors.
>
> 9. Parse the tool call response to extract the structured data from `choices[0].message.tool_calls[0].function.arguments`.
>
> 10. If `documentId` is provided, update the `documents` table: set `extracted_data` to the parsed data and `status` to `"analyzed"`, filtering by `id = documentId` and `user_id = authenticated user id`.
>
> 11. Return `{ success: true, data: extractedData }` with CORS headers.
>
> 12. Wrap everything in try/catch and log errors with `console.error`.
>
> Use `https://deno.land/std@0.168.0/http/server.ts` for serve and `https://esm.sh/@supabase/supabase-js@2` for the Supabase client.

---

### Full Code: `analyze-document/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { documentId, fileContent, fileName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a financial document analyzer for Indian taxpayers. Extract structured financial data from the provided document content.

Return a JSON object with these fields (use 0 for missing values):
- document_type: string (e.g., "Form 16", "Salary Slip", "Investment Proof", "Bank Statement", "Other")
- employer_name: string or null
- financial_year: string (e.g., "2025-26")
- gross_salary: number
- hra_received: number
- lta_received: number
- other_income: number
- deductions_80c: number (PPF, ELSS, LIC, etc.)
- deductions_80d: number (health insurance)
- deductions_80e: number (education loan interest)
- deductions_80g: number (donations)
- deductions_nps: number (NPS contributions)
- professional_tax: number
- tds_deducted: number
- key_findings: string[] (list of important observations)

Be thorough in extracting all financial figures. If the document is an image or unclear, do your best to extract what you can.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this document (${fileName}):\n\n${fileContent}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_financial_data",
            description: "Extract structured financial data from the document",
            parameters: {
              type: "object",
              properties: {
                document_type: { type: "string" },
                employer_name: { type: "string" },
                financial_year: { type: "string" },
                gross_salary: { type: "number" },
                hra_received: { type: "number" },
                lta_received: { type: "number" },
                other_income: { type: "number" },
                deductions_80c: { type: "number" },
                deductions_80d: { type: "number" },
                deductions_80e: { type: "number" },
                deductions_80g: { type: "number" },
                deductions_nps: { type: "number" },
                professional_tax: { type: "number" },
                tds_deducted: { type: "number" },
                key_findings: { type: "array", items: { type: "string" } },
              },
              required: ["document_type", "gross_salary", "key_findings"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_financial_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let extractedData = {};

    if (toolCall?.function?.arguments) {
      extractedData = JSON.parse(toolCall.function.arguments);
    }

    if (documentId) {
      await supabase.from("documents").update({
        extracted_data: extractedData,
        status: "analyzed",
      }).eq("id", documentId).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 2. tax-analysis

### Prompt for Supabase AI Assistant

Copy and paste this entire prompt into the Supabase AI assistant when creating the `tax-analysis` edge function:

---

> **Prompt:**
>
> Create a Deno edge function called `tax-analysis` that does the following:
>
> 1. Handle CORS preflight (OPTIONS) requests. Use these CORS headers:
>    ```
>    Access-Control-Allow-Origin: *
>    Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
>    ```
>
> 2. Extract the `Authorization` header. If missing, return error.
>
> 3. Create a Supabase client using `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars, passing the Authorization header.
>
> 4. Authenticate the user using `supabase.auth.getUser()`. If unauthorized, return error.
>
> 5. Parse the JSON body to get: `financialData` (object) and `profile` (object).
>
> 6. Read the `LOVABLE_API_KEY` secret from environment. If not set, return error.
>
> 7. Call the AI gateway at `https://ai.gateway.lovable.dev/v1/chat/completions` with:
>    - Method: POST
>    - Headers: `Authorization: Bearer ${LOVABLE_API_KEY}`, `Content-Type: application/json`
>    - Model: `google/gemini-3-flash-preview`
>    - System prompt: "You are an expert Indian tax consultant AI. Analyze the user's financial data and provide comprehensive tax guidance for the Indian tax system (FY 2025-26). Rules: Calculate tax under both Old and New regimes accurately. New regime FY 2025-26 slabs: 0-4L (nil), 4-8L (5%), 8-12L (10%), 12-16L (15%), 16-20L (20%), 20-24L (25%), >24L (30%). Standard deduction: 75,000. Old regime: 0-2.5L (nil), 2.5-5L (5%), 5-10L (20%), >10L (30%). Standard deduction: 50,000. Section 87A rebate: Old regime up to 5L taxable (12,500 max); New regime up to 12L taxable (60,000 max). 4% cess on total tax. Suggest specific deductions the user can claim but hasn't. Recommend the better regime with clear reasoning. Suggest eligible government schemes. Provide actionable, specific advice."
>    - User message should include the profile info (employment_type, age_group, income_sources, tax_regime) and the full financialData as JSON.
>    - Use function calling (tools) with a function named `provide_tax_analysis` with these parameters:
>      - old_regime_tax (number): Total tax under old regime including cess
>      - new_regime_tax (number): Total tax under new regime including cess
>      - recommended_regime (string, enum: ["old", "new"])
>      - regime_reasoning (string)
>      - total_income (number)
>      - total_deductions_old (number)
>      - taxable_income_old (number)
>      - taxable_income_new (number)
>      - savings_potential (number)
>      - deduction_suggestions (array of objects with: section, title, description, max_limit, current_claimed, potential_saving)
>      - scheme_recommendations (array of objects with: name, type, tax_benefit, eligibility, description, how_to_apply)
>      - analysis_summary (string)
>    - Required fields: old_regime_tax, new_regime_tax, recommended_regime, deduction_suggestions, scheme_recommendations, analysis_summary
>    - Set `tool_choice` to force the `provide_tax_analysis` function.
>
> 8. Handle error responses: 429 for rate limits, 402 for payment required, 500 for other errors.
>
> 9. Parse the tool call response from `choices[0].message.tool_calls[0].function.arguments`.
>
> 10. Save the analysis to the `tax_analyses` table:
>     - First check if a record exists for this user and financial_year (from financialData.financial_year, default "2025-26") using `.select("id").eq("financial_year", fy).single()`
>     - If exists: update with the analysis fields (old_regime_tax, new_regime_tax, recommended_regime, deduction_suggestions, scheme_recommendations, analysis_summary)
>     - If not exists: insert a new record with user_id, financial_year, and all analysis fields
>
> 11. Return `{ success: true, data: analysisData }` with CORS headers.
>
> 12. Wrap everything in try/catch and log errors with `console.error`.
>
> Use `https://deno.land/std@0.168.0/http/server.ts` for serve and `https://esm.sh/@supabase/supabase-js@2` for the Supabase client.

---

### Full Code: `tax-analysis/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { financialData, profile } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert Indian tax consultant AI. Analyze the user's financial data and provide comprehensive tax guidance for the Indian tax system (FY 2025-26).

Rules:
- Calculate tax under both Old and New regimes accurately
- New regime FY 2025-26 slabs: 0-4L (nil), 4-8L (5%), 8-12L (10%), 12-16L (15%), 16-20L (20%), 20-24L (25%), >24L (30%). Standard deduction: 75,000.
- Old regime: 0-2.5L (nil), 2.5-5L (5%), 5-10L (20%), >10L (30%). Standard deduction: 50,000.
- Section 87A rebate: Old regime up to 5L taxable (12,500 max); New regime up to 12L taxable (60,000 max).
- 4% cess on total tax
- Suggest specific deductions the user can claim but hasn't
- Recommend the better regime with clear reasoning
- Suggest eligible government schemes

Provide actionable, specific advice.`;

    const userPrompt = `User Profile:
- Employment: ${profile?.employment_type || "salaried"}
- Age Group: ${profile?.age_group || "below-60"}
- Income Sources: ${profile?.income_sources?.join(", ") || "salary"}
- Current Regime: ${profile?.tax_regime || "not chosen"}

Financial Data:
${JSON.stringify(financialData, null, 2)}

Provide complete tax analysis with regime comparison, deduction suggestions, and scheme recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_tax_analysis",
            description: "Provide comprehensive tax analysis",
            parameters: {
              type: "object",
              properties: {
                old_regime_tax: { type: "number", description: "Total tax under old regime including cess" },
                new_regime_tax: { type: "number", description: "Total tax under new regime including cess" },
                recommended_regime: { type: "string", enum: ["old", "new"] },
                regime_reasoning: { type: "string", description: "Why this regime is better" },
                total_income: { type: "number" },
                total_deductions_old: { type: "number" },
                taxable_income_old: { type: "number" },
                taxable_income_new: { type: "number" },
                savings_potential: { type: "number", description: "Additional savings possible" },
                deduction_suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      section: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" },
                      max_limit: { type: "number" },
                      current_claimed: { type: "number" },
                      potential_saving: { type: "number" },
                    },
                    required: ["section", "title", "description", "max_limit", "potential_saving"],
                  },
                },
                scheme_recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      tax_benefit: { type: "string" },
                      eligibility: { type: "string" },
                      description: { type: "string" },
                      how_to_apply: { type: "string" },
                    },
                    required: ["name", "type", "tax_benefit", "description"],
                  },
                },
                analysis_summary: { type: "string" },
              },
              required: ["old_regime_tax", "new_regime_tax", "recommended_regime", "deduction_suggestions", "scheme_recommendations", "analysis_summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_tax_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let analysisData: any = {};

    if (toolCall?.function?.arguments) {
      analysisData = JSON.parse(toolCall.function.arguments);
    }

    // Save analysis
    const fy = financialData.financial_year || "2025-26";
    const { data: existing } = await supabase.from("tax_analyses")
      .select("id").eq("financial_year", fy).single();

    const analysisPayload = {
      old_regime_tax: analysisData.old_regime_tax || 0,
      new_regime_tax: analysisData.new_regime_tax || 0,
      recommended_regime: analysisData.recommended_regime,
      deduction_suggestions: analysisData.deduction_suggestions,
      scheme_recommendations: analysisData.scheme_recommendations,
      analysis_summary: analysisData.analysis_summary,
    };

    if (existing) {
      await supabase.from("tax_analyses").update(analysisPayload).eq("id", existing.id);
    } else {
      await supabase.from("tax_analyses").insert({
        user_id: user.id,
        financial_year: fy,
        ...analysisPayload,
      });
    }

    return new Response(JSON.stringify({ success: true, data: analysisData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tax-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## Key Points

- **Model used:** `google/gemini-3-flash-preview` (fast, balanced quality)
- **AI Gateway URL:** `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Authentication:** Both functions validate JWT inside the code (not via Supabase's built-in JWT verification)
- **Structured output:** Uses OpenAI-compatible **function calling / tool use** to get structured JSON — no regex parsing needed
- **Error handling:** 429 (rate limit), 402 (credits exhausted), and generic 500 errors are all handled and returned to the client
