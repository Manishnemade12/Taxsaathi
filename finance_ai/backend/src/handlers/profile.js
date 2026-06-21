import { jsonError, jsonResponse } from '../lib/response.js';

export function getProfile(sb) {
  return async (req, res) => {
    try {
      const { id, jwt } = req.user;
      const data = await sb.querySingle('profiles', `select=*&user_id=eq.${id}`, jwt);
      if (!data) {
        return jsonError(res, 'profile not found', 404);
      }
      return res.json(data);
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}

export function updateProfile(sb) {
  return async (req, res) => {
    try {
      const { id, jwt } = req.user;
      const allowed = new Set(['full_name', 'employment_type', 'age_group', 'tax_regime', 'income_sources']);
      const update = {};
      for (const [key, value] of Object.entries(req.body || {})) {
        if (allowed.has(key)) {
          update[key] = value;
        }
      }

      const result = await sb.update('profiles', `user_id=eq.${id}`, update, jwt);
      return jsonResponse(res, result);
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}

export function completeOnboarding(sb) {
  return async (req, res) => {
    try {
      const { id, jwt } = req.user;
      const { employment_type: employmentType, income_sources: incomeSources, age_group: ageGroup, tax_regime: taxRegime } = req.body || {};

      await sb.update('profiles', `user_id=eq.${id}`, {
        employment_type: employmentType,
        income_sources: incomeSources,
        age_group: ageGroup,
        tax_regime: taxRegime,
        onboarding_completed: true,
      }, jwt);

      await sb.insert('financial_data', {
        user_id: id,
        financial_year: '2025-26',
      }, jwt);

      return jsonResponse(res, { success: true });
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}
