import { jsonError } from '../lib/response.js';

function toNumber(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function buildIncomeData(finData) {
  if (!finData) {
    return null;
  }

  const items = [
    ['Salary', 'gross_salary'],
    ['Rental', 'rental_income'],
    ['Interest', 'interest_income'],
    ['Other', 'other_income'],
    ['Business', 'business_income'],
  ];

  const result = [];
  for (const [name, key] of items) {
    const value = toNumber(finData[key]);
    if (value > 0) {
      result.push({ name, value });
    }
  }
  return result;
}

export function getStats(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;

      const [docCount, finData, analysisData] = await Promise.all([
        sb.count('documents', `user_id=eq.${userId}`, jwt),
        sb.querySingle('financial_data', `select=*&user_id=eq.${userId}&financial_year=eq.2025-26`, jwt),
        sb.querySingle('tax_analyses', `select=*&user_id=eq.${userId}&financial_year=eq.2025-26`, jwt),
      ]);

      let totalIncome = 0;
      let estimatedTax = 0;
      let savings = 0;

      if (finData) {
        totalIncome = toNumber(finData.gross_salary) + toNumber(finData.other_income) + toNumber(finData.rental_income) + toNumber(finData.interest_income) + toNumber(finData.business_income);
      }

      if (analysisData) {
        const oldTax = toNumber(analysisData.old_regime_tax);
        const newTax = toNumber(analysisData.new_regime_tax);
        estimatedTax = Math.min(oldTax, newTax);
        savings = Math.abs(oldTax - newTax);
      }

      return res.json({
        documents: docCount,
        totalIncome,
        estimatedTax,
        savings,
        incomeData: buildIncomeData(finData),
      });
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}
