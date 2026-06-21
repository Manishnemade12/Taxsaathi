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

    // Update document record
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
