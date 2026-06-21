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

    // Save analysis - check if exists first, then insert or update
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
