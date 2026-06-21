import { jsonError, jsonResponse } from '../lib/response.js';
import { normalizeFinancialUpdate } from './financialFields.js';

export function getAnalysis(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const data = await sb.querySingle('tax_analyses', `select=*&user_id=eq.${userId}&financial_year=eq.2025-26`, jwt);
      if (!data) {
        return res.type('json').send('null');
      }
      return res.json(data);
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}

export function runAnalysis(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const { financialData, profile } = req.body || {};

      if (financialData && typeof financialData === 'object') {
        const finUpdate = {};
        for (const [key, value] of Object.entries(financialData)) {
          if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
            finUpdate[key] = value;
          }
        }
        const normalized = normalizeFinancialUpdate(finUpdate);
        if (Object.keys(normalized).length > 0) {
          await sb.update('financial_data', `user_id=eq.${userId}&financial_year=eq.2025-26`, normalized, jwt);
        }
      }

      const result = await sb.invokeEdgeFunction('tax-analysis', {
        financialData,
        profile,
      }, jwt);

      return jsonResponse(res, { success: true, data: result });
    } catch (error) {
      return jsonError(res, `analysis failed: ${error.message}`, 500);
    }
  };
}
