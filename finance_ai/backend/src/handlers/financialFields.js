const allowedFinancialFields = {
  gross_salary: true,
  hra_received: true,
  lta_received: true,
  other_income: true,
  rental_income: true,
  interest_income: true,
  business_income: true,
  deductions_80c: true,
  deductions_80d: true,
  deductions_80e: true,
  deductions_80g: true,
  deductions_nps: true,
  deductions_hra: true,
  deductions_lta: true,
  standard_deduction: true,
  other_deductions: true,
  raw_data: true,
  financial_year: true,
};

const financialFieldAliases = {
  deduction_80c: 'deductions_80c',
  deduction_80d: 'deductions_80d',
  deduction_80e: 'deductions_80e',
  deduction_80g: 'deductions_80g',
  deduction_nps: 'deductions_nps',
  hra_exemption: 'deductions_hra',
  professional_tax: 'other_deductions',
};

export function normalizeFinancialUpdate(input) {
  const result = {};
  for (const [key, value] of Object.entries(input || {})) {
    const normalizedKey = financialFieldAliases[key] || key;
    if (allowedFinancialFields[normalizedKey]) {
      result[normalizedKey] = value;
    }
  }
  return result;
}
