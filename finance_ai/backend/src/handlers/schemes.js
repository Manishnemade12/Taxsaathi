import { jsonError, jsonResponse } from '../lib/response.js';

export function getSchemes(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const data = await sb.querySingle('tax_analyses', `select=scheme_recommendations&user_id=eq.${userId}&financial_year=eq.2025-26`, jwt);
      if (!data) {
        return jsonResponse(res, { schemes: null });
      }

      return jsonResponse(res, { schemes: data.scheme_recommendations ?? null });
    } catch {
      return jsonResponse(res, { schemes: null });
    }
  };
}

export function getPersonalizedSchemes(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const [finData, profileData] = await Promise.all([
        sb.querySingle('financial_data', `select=*&user_id=eq.${userId}&financial_year=eq.2025-26`, jwt),
        sb.querySingle('profiles', `select=*&user_id=eq.${userId}`, jwt),
      ]);

      const result = await sb.invokeEdgeFunction('tax-analysis', {
        financialData: finData || {},
        profile: profileData || {},
      }, jwt);

      return jsonResponse(res, {
        schemes: result.scheme_recommendations,
        data: result,
      });
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}
