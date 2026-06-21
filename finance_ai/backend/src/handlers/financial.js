import { jsonError } from '../lib/response.js';
import { normalizeFinancialUpdate } from './financialFields.js';

function unwrapSingleResult(result) {
  if (Array.isArray(result)) {
    return result[0] ?? null;
  }
  return result;
}

export function getFinancialData(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const data = await sb.querySingle('financial_data', `select=*&user_id=eq.${userId}&financial_year=eq.2025-26`, jwt);
      if (!data) {
        const result = await sb.insert('financial_data', {
          user_id: userId,
          financial_year: '2025-26',
        }, jwt);
        return res.json(unwrapSingleResult(result));
      }
      return res.json(data);
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}

export function updateFinancialData(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const body = { ...(req.body || {}) };
      delete body.id;
      delete body.user_id;
      delete body.created_at;
      delete body.updated_at;

      const update = normalizeFinancialUpdate(body);
      if (Object.keys(update).length === 0) {
        return jsonError(res, 'no valid financial fields provided', 400);
      }

      const result = await sb.update('financial_data', `user_id=eq.${userId}&financial_year=eq.2025-26`, update, jwt);
      return res.json(result);
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}
