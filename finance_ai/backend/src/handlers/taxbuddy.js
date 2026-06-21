import { jsonError, jsonResponse } from '../lib/response.js';
import { callGroq } from '../lib/groq.js';

function sanitizeTaxBuddyOutput(raw) {
  let text = raw.trim();
  const replacements = [
    ['### 📝 Your Personalized Tax Strategy', 'Your Personalized Tax Strategy'],
    ["### 💬 Let's Get Started", "Let's Get Started"],
    ['**Disclaimer:**', 'Disclaimer:'],
    ['* **The Verdict:**', 'The Verdict:'],
    ['* **Big Wins:**', 'Big Wins:'],
    ['* **Smart Alerts:**', 'Smart Alerts:'],
    ['**The Verdict:**', 'The Verdict:'],
    ['**Big Wins:**', 'Big Wins:'],
    ['**Smart Alerts:**', 'Smart Alerts:'],
    ['---', ''],
  ];

  for (const [oldValue, newValue] of replacements) {
    text = text.split(oldValue).join(newValue);
  }

  const lines = text.split('\n');
  const cleaned = [];
  let seenTitle = false;

  for (let line of lines) {
    line = line.trim().replace(/^\*/, '').trim();
    if (!line) {
      if (cleaned.length > 0 && cleaned[cleaned.length - 1] !== '') {
        cleaned.push('');
      }
      continue;
    }
    if (line.toLowerCase() === 'your personalized tax strategy') {
      if (seenTitle) {
        continue;
      }
      seenTitle = true;
    }
    cleaned.push(line);
  }

  return cleaned.join('\n').trim();
}

function determineITR(req) {
  if (req.has_business) {
    return ['ITR-3', 'Since you have business/freelancing income, you need a return meant for business/professional income.'];
  }
  if (req.is_director) {
    return ['ITR-2', 'Since you are a company director, you need the more detailed ITR form that captures director disclosures.'];
  }
  if (req.has_cap_gains) {
    return ['ITR-2', 'Since you reported capital gains from stocks/mutual funds/property, ITR-1 is not applicable.'];
  }
  if (String(req.res_status || '').toUpperCase() === 'NRI' || String(req.res_status || '').toUpperCase() === 'RNOR') {
    return ['ITR-2', 'Since your residential status is not resident, you need ITR-2 for the required disclosures.'];
  }
  if (Number(req.est_income || 0) > 5000000) {
    return ['ITR-2', 'Since estimated annual income is above ₹50L, the law requires a more detailed return.'];
  }
  return ['ITR-1', 'Based on your current profile, basic resident individual filing conditions fit ITR-1.'];
}

function buildAlerts(req) {
  const alerts = [];
  if (Number(req.est_income || 0) > 5000000) {
    alerts.push('Schedule AL is typically required because income exceeds ₹50L');
  }
  if (Number(req.age || 0) >= 60) {
    alerts.push('Senior citizen: check Section 80TTB benefit up to ₹50,000 on eligible interest');
  }
  if (req.has_agri) {
    alerts.push('Agricultural income may trigger partial integration for rate calculation');
  }
  return alerts.length > 0 ? alerts.join('; ') : 'No high-risk filing alert detected from current answers';
}

function buildContextSummary(req) {
  return `- Age: ${req.age}\n- Residential status: ${req.res_status}\n- Has business/freelancing income: ${!!req.has_business}\n- Has capital gains: ${!!req.has_cap_gains}\n- Estimated annual income: ₹${Number(req.est_income || 0).toFixed(0)}\n- Has agriculture income: ${!!req.has_agri}\n- Director in a company: ${!!req.is_director}`;
}

export function generateStrategy(sb) {
  return async (req, res) => {
    try {
      const body = req.body || {};
      if (!(body.age > 0)) {
        return jsonError(res, 'age is required', 400);
      }
      if (!body.res_status) {
        return jsonError(res, 'residential status is required', 400);
      }

      const [verdict, reason] = determineITR(body);
      const alerts = buildAlerts(body);
      const contextSummary = buildContextSummary(body);

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return jsonError(res, 'GROQ_API_KEY is not configured', 500);
      }

      const systemPrompt = `Role: You are "TaxBuddy," an intelligent, empathetic, and witty AI Tax Assistant helping Pranav with Indian taxes for FY 2025-26.

Core directives:
1) Context First: Start by acknowledging backend-provided facts.
2) The Why Behind ITR: Explain specific reason for ITR choice.
3) One Step at a Time: Ask exactly ONE follow-up question.
4) Be Proactive:
   - If senior citizen (60+), mention Section 80TTB deduction of ₹50,000.
   - If agriculture income exists, explain Partial Integration simply.

Output rules:
- Return plain text only (no markdown symbols like ###, *, **, -, backticks).
- Keep this exact readable structure:
	Your Personalized Tax Strategy
	The Verdict: ...
	Big Wins: ...
	Smart Alerts: ...

	Let's Get Started
	... exactly one follow-up question ...

	Disclaimer: I provide AI-guided strategy for informational purposes. Please verify final filings with a CA.`;

      const userPrompt = `Use this backend context (do not override these facts):\n${contextSummary}\n\nBackend verdict:\n- ITR form: ${verdict}\n- Primary reason: ${reason}\n- Smart alerts: ${alerts}\n\nNow generate the final user-facing strategy in the exact required format.`;

      const aiText = sanitizeTaxBuddyOutput(await callGroq(apiKey, systemPrompt, userPrompt));

      return jsonResponse(res, {
        success: true,
        data: {
          strategy: aiText,
          itr_form: verdict,
          primary_reason: reason,
          smart_alerts: alerts,
        },
      });
    } catch (error) {
      return jsonError(res, `taxbuddy generation failed: ${error.message}`, 502);
    }
  };
}
