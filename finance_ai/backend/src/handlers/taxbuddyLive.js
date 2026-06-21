import { jsonError, jsonResponse } from '../lib/response.js';
import { callGroq } from '../lib/groq.js';

const modeGeneral = 'general';
const modeSalary = 'salary';
const modeCapital = 'capital_gains';
const modeBusiness = 'business';
const modeHouse = 'house_property';
const modeDeductions = 'deductions';
const modeTaxPaid = 'tax_paid';
const modeReview = 'review';

function liveStepDefs() {
  return [
    { fieldName: 'resident_status', question: 'Are you Resident or Non-Resident?', portalField: 'Filing Status > Residential Status', hint: 'Choose as per days stayed in India for the year.', exampleValue: 'Resident', mode: modeGeneral },
    { fieldName: 'income_sources', question: 'Select your income types: Salary / Business / Capital Gains / House Property / Other Sources.', portalField: 'Income Details > Income Sources', hint: 'Share all applicable types in one line.', exampleValue: 'Salary, Other Sources', mode: modeGeneral },
    { fieldName: 'annual_income', question: 'What is your total annual income?', portalField: 'Part B-TI > Gross Total Income', hint: 'Use full-year amount before deductions.', exampleValue: '1250000', mode: modeGeneral },
    { fieldName: 'salary_gross', question: 'What is your gross salary from Form 16 Part B?', portalField: 'Salary Schedule > Gross Salary', hint: 'Enter exact gross salary from Form 16.', exampleValue: '980000', mode: modeSalary },
    { fieldName: 'salary_tds', question: 'What is TDS deducted by employer?', portalField: 'Schedule TDS1 > TDS from Salary', hint: 'Use Form 16 tax deducted value.', exampleValue: '65000', mode: modeSalary },
    { fieldName: 'capital_gain_type', question: 'Are your capital gains LTCG or STCG?', portalField: 'Schedule CG > Type of Capital Gain', hint: 'Mention both if both exist.', exampleValue: 'LTCG on equity', mode: modeCapital },
    { fieldName: 'capital_gain_amount', question: 'What is taxable capital gain amount?', portalField: 'Schedule CG > Capital Gains Amount', hint: 'Use net taxable gain after set-off.', exampleValue: '120000', mode: modeCapital },
    { fieldName: 'business_turnover', question: 'What is your turnover and are you opting presumptive 44AD/44ADA?', portalField: 'Business Schedule > Turnover / Presumptive Option', hint: 'Mention turnover + yes/no for presumptive.', exampleValue: '42L, presumptive yes', mode: modeBusiness },
    { fieldName: 'business_profit', question: 'What is your taxable business/professional income?', portalField: 'Business Schedule > Net Profit', hint: 'Enter income after admissible expenses or presumptive rate.', exampleValue: '720000', mode: modeBusiness },
    { fieldName: 'house_property_type', question: 'Is your house property self-occupied or let-out?', portalField: 'Schedule HP > Property Type', hint: 'Select one per property.', exampleValue: 'Self-occupied', mode: modeHouse },
    { fieldName: 'house_interest', question: 'How much housing-loan interest are you claiming?', portalField: 'Schedule HP > Interest on Borrowed Capital', hint: 'Enter eligible interest as per rules.', exampleValue: '200000', mode: modeHouse },
    { fieldName: 'deduction_summary', question: 'Share deductions: 80C, 80D, 80E, 80G, NPS in one line.', portalField: 'Deductions > Chapter VI-A', hint: 'Use 0 for not applicable sections.', exampleValue: '80C 150000, 80D 25000, 80G 5000', mode: modeDeductions },
    { fieldName: 'other_income', question: 'Enter interest/dividend/other-source income total.', portalField: 'Schedule OS > Other Sources', hint: 'Include FD interest, savings interest, dividends.', exampleValue: '38000', mode: modeDeductions },
    { fieldName: 'tax_paid', question: 'Enter total tax already paid (TDS/TCS/Advance Tax/Self Assessment).', portalField: 'Tax Paid > Taxes Paid Summary', hint: 'Sum all taxes already paid.', exampleValue: '82000', mode: modeTaxPaid },
    { fieldName: 'bank_account', question: 'Confirm refund bank account and IFSC for e-verification.', portalField: 'Bank Details > Refund Bank Account', hint: 'Use pre-validated account in portal.', exampleValue: 'HDFC.... / XXXX1234', mode: modeReview },
  ];
}

function collectExpectedFields() {
  return liveStepDefs().map((def) => def.portalField);
}

function isAnswered(value) {
  const text = String(value ?? '').trim().toLowerCase();
  return text !== '' && text !== '0' && text !== 'na' && text !== 'n/a' && text !== 'none';
}

function asFloat(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function format0(value) {
  if (value <= 0) {
    return '';
  }
  return String(Math.round(value));
}

function joinNonEmpty(...parts) {
  return parts.map((part) => String(part || '').trim()).filter(Boolean).join(', ');
}

function detectPrimaryMode(answers) {
  const sources = String(answers?.income_sources || '').toLowerCase();
  if (sources.includes('business') || sources.includes('freelancer') || sources.includes('profession')) {
    return modeBusiness;
  }
  if (sources.includes('capital') || sources.includes('cg')) {
    return modeCapital;
  }
  if (sources.includes('house') || sources.includes('rental')) {
    return modeHouse;
  }
  return modeSalary;
}

function deriveITRForm(answers) {
  const sources = String(answers?.income_sources || answers?.employment_type || '').toLowerCase();
  if (sources.includes('business') || sources.includes('freelancer') || sources.includes('profession')) {
    const turnover = String(answers?.business_turnover || '').toLowerCase();
    if (turnover.includes('presumptive yes') || turnover.includes('44ad') || turnover.includes('44ada')) {
      return 'ITR-4';
    }
    return 'ITR-3';
  }
  if (sources.includes('capital')) {
    return 'ITR-2';
  }
  return 'ITR-1';
}

function stepApplicable(step, state) {
  if (isAnswered(state.answers?.[step.fieldName])) {
    return false;
  }
  if ([modeGeneral, modeDeductions, modeTaxPaid, modeReview].includes(step.mode)) {
    return true;
  }
  const mode = detectPrimaryMode(state.answers);
  if (mode === modeGeneral) {
    return step.mode === modeSalary;
  }
  return step.mode === mode;
}

function nextRelevantStep(startIndex, state) {
  const defs = liveStepDefs();
  for (let index = startIndex; index < defs.length; index += 1) {
    if (stepApplicable(defs[index], state)) {
      return index;
    }
  }
  return defs.length;
}

async function prefillFromExistingData(sb, req, state) {
  if (!sb || !req?.user?.id || !req?.user?.jwt) {
    return 0;
  }

  let prefilled = 0;
  const { id: userId, jwt } = req.user;

  try {
    const profile = await sb.querySingle('profiles', `select=*&user_id=eq.${userId}`, jwt);
    if (profile) {
      if (String(profile.employment_type || '').trim()) {
        state.answers.employment_type = profile.employment_type;
        prefilled += 1;
      }
      if (String(profile.tax_regime || '').trim()) {
        state.answers.tax_regime = profile.tax_regime;
        prefilled += 1;
      }
      if (String(profile.full_name || '').trim()) {
        state.answers.full_name = profile.full_name;
        prefilled += 1;
      }
      if (Array.isArray(profile.income_sources) && profile.income_sources.length > 0) {
        const joined = profile.income_sources.filter((item) => String(item || '').trim()).join(', ');
        if (joined) {
          state.answers.income_sources = joined;
          prefilled += 1;
        }
      }
    }
  } catch {
    // ignore prefill failures
  }

  try {
    const fin = await sb.querySingle('financial_data', `select=*&user_id=eq.${userId}&financial_year=eq.2025-26`, jwt);
    if (fin) {
      const grossSalary = asFloat(fin.gross_salary);
      const otherIncome = asFloat(fin.other_income) + asFloat(fin.interest_income);
      const houseIncome = asFloat(fin.rental_income);
      const businessIncome = asFloat(fin.business_income);

      const totalAnnual = grossSalary + otherIncome + houseIncome + businessIncome;
      if (totalAnnual > 0) {
        state.answers.annual_income = format0(totalAnnual);
        prefilled += 1;
      }
      if (grossSalary > 0) {
        state.answers.salary_gross = format0(grossSalary);
        prefilled += 1;
      }
      if (houseIncome > 0) {
        state.answers.house_property_type = 'Let-out';
        prefilled += 1;
      }

      let houseInterest = asFloat(fin.deductions_home_loan_interest);
      if (houseInterest <= 0) {
        houseInterest = asFloat(fin.home_loan_interest);
      }
      if (houseInterest > 0) {
        state.answers.house_interest = format0(houseInterest);
        prefilled += 1;
      }

      const ded = joinNonEmpty(
        `80C ${format0(asFloat(fin.deductions_80c))}`,
        `80D ${format0(asFloat(fin.deductions_80d))}`,
        `80E ${format0(asFloat(fin.deductions_80e))}`,
        `80G ${format0(asFloat(fin.deductions_80g))}`,
        `NPS ${format0(asFloat(fin.deductions_nps))}`,
      );
      const cleanedDed = ded.replace(/ 0/g, '');
      if (cleanedDed.trim()) {
        state.answers.deduction_summary = cleanedDed;
        prefilled += 1;
      }

      if (otherIncome > 0) {
        state.answers.other_income = format0(otherIncome);
        prefilled += 1;
      }
    }
  } catch {
    // ignore prefill failures
  }

  if (!state.answers.income_sources) {
    const sources = [];
    if (isAnswered(state.answers.salary_gross)) {
      sources.push('Salary');
    }
    if (isAnswered(state.answers.house_interest) || String(state.answers.house_property_type || '').toLowerCase() === 'let-out') {
      sources.push('House Property');
    }
    if (String(state.answers.employment_type || '').toLowerCase().includes('business') || String(state.answers.employment_type || '').toLowerCase().includes('freelance')) {
      sources.push('Business');
    }
    if (sources.length > 0) {
      state.answers.income_sources = sources.join(', ');
      prefilled += 1;
    }
  }

  return prefilled;
}

function sortedAnswerPreview(answers) {
  const entries = Object.entries(answers || {});
  if (entries.length === 0) {
    return 'none';
  }
  return entries.sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('; ');
}

async function buildLiveQuestionText(state, next, intro) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const base = `Fill portal field '${next.portalField}'. ${next.question}`;
    return intro ? `${intro} ${base}` : base;
  }

  const systemPrompt = `You are a professional Indian Tax Consultant AI helping users file ITR in real time.
Rules:
- Ask one question at a time.
- Give exact field-level guidance for the current portal field.
- Keep response short (max 4 lines).
- End response with exactly one question.
- Do not ask user to submit all details at once.`;

  const prefix = intro ? `Session intro: ${intro}\n` : '';
  const userPrompt = `${prefix}Known answers: ${sortedAnswerPreview(state.answers)}
Current portal field: ${next.portalField}
Field hint: ${next.hint}
Example: ${next.exampleValue}
Ask this next question: ${next.question}`;

  try {
    const text = await callGroq(apiKey, systemPrompt, userPrompt);
    return text.trim() || `Current field: ${next.portalField}. ${next.question} Example: ${next.exampleValue}`;
  } catch {
    return `Current field: ${next.portalField}. ${next.question} Example: ${next.exampleValue}`;
  }
}

function buildLiveCompletionText(state) {
  const itr = state.itr_form || deriveITRForm(state.answers);
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Promise.resolve(`Recommended form: ${itr}. Review all schedules, verify tax paid, submit return, and complete e-verification.`);
  }

  const systemPrompt = `You are a professional Indian Tax Consultant AI.
Create final compact handoff after real-time filing guidance.
Output: 1) Recommended ITR with reason 2) 6-step filing closure checklist 3) e-verify reminder.`;
  const userPrompt = `Answers: ${sortedAnswerPreview(state.answers)}
ITR form: ${itr}
Give concise completion message for first-time filer.`;

  return callGroq(apiKey, systemPrompt, userPrompt)
    .then((text) => text.trim() || `Based on your entries, file using ${itr} and complete preview, submit, and e-verify.`)
    .catch(() => `Based on your entries, file using ${itr} and complete preview, submit, and e-verify.`);
}

function completionChecklist(state) {
  const itr = state.itr_form || deriveITRForm(state.answers);
  return [
    `Form: ${itr}`,
    'Validate Personal Info + Bank Account',
    'Validate income schedules (Salary/CG/Business/HP/OS)',
    'Validate deductions under Chapter VI-A',
    'Match Tax Paid with Form 16/26AS/AIS',
    'Preview, Submit, and e-Verify return',
  ];
}

function buildResponse({ assistantText, fieldName, fieldHint, exampleValue, state, completed, quickChecklist }) {
  return {
    success: true,
    assistant_text: assistantText,
    field_name: fieldName,
    field_hint: fieldHint,
    example_value: exampleValue,
    state,
    completed,
    ...(quickChecklist ? { quick_checklist: quickChecklist } : {}),
  };
}

export function startLiveCoach(sb) {
  return async (req, res) => {
    try {
      const body = req.body || {};
      const defs = liveStepDefs();
      const first = defs[0];
      const state = {
        mode: modeGeneral,
        step: 0,
        answers: {},
        last_field: first.fieldName,
        completed: false,
        itr_form: '',
        expected_fields: collectExpectedFields(),
      };

      const prefilledCount = await prefillFromExistingData(sb, req, state);
      state.mode = detectPrimaryMode(state.answers);
      state.itr_form = deriveITRForm(state.answers);

      const nextStep = nextRelevantStep(0, state);
      if (nextStep >= defs.length) {
        state.completed = true;
        state.step = defs.length;
        const assistantText = await buildLiveCompletionText(state);
        return jsonResponse(res, buildResponse({
          assistantText,
          fieldName: 'Final Review',
          fieldHint: 'Most fields are auto-filled from your existing data. Review and e-verify.',
          exampleValue: 'Aadhaar OTP',
          state,
          completed: true,
          quickChecklist: completionChecklist(state),
        }));
      }

      state.step = nextStep;
      const next = defs[nextStep];
      state.last_field = next.fieldName;

      let intro = 'I will guide you field-by-field while filing ITR in real time. I will ask one thing at a time and tell you exactly what to fill in the portal.';
      if (String(body.name || '').trim()) {
        intro = `${String(body.name || '').trim()}, ${intro}`;
      }
      if (prefilledCount > 0) {
        intro = `${intro} I prefilled ${prefilledCount} fields from your saved Tax Analysis/Profile data and will only ask missing details.`;
      }

      const assistantText = await buildLiveQuestionText(state, next, intro);
      return jsonResponse(res, buildResponse({
        assistantText,
        fieldName: next.portalField,
        fieldHint: next.hint,
        exampleValue: next.exampleValue,
        state,
        completed: false,
      }));
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}

export function liveCoachMessage(sb) {
  return async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.state) {
        return jsonError(res, 'state is required', 400);
      }

      const state = body.state;
      if (!state.answers) {
        state.answers = {};
      }

      if (state.completed) {
        return jsonResponse(res, buildResponse({
          assistantText: 'Live ITR coach session is completed. Start again to file a fresh return.',
          state,
          completed: true,
          quickChecklist: completionChecklist(state),
        }));
      }

      const defs = liveStepDefs();
      if (state.step >= 0 && state.step < defs.length) {
        const current = defs[state.step];
        if (String(body.message || '').trim()) {
          state.answers[current.fieldName] = String(body.message).trim();
        }
      }

      if (state.step === 2) {
        state.mode = detectPrimaryMode(state.answers);
        state.itr_form = deriveITRForm(state.answers);
      }

      const nextStep = nextRelevantStep(state.step + 1, state);
      if (nextStep >= defs.length) {
        state.completed = true;
        state.step = defs.length;
        if (!state.itr_form) {
          state.itr_form = deriveITRForm(state.answers);
        }
        const assistantText = await buildLiveCompletionText(state);
        return jsonResponse(res, buildResponse({
          assistantText,
          fieldName: 'Final Review',
          fieldHint: 'Preview return, validate schedules, submit, then e-verify.',
          exampleValue: 'Aadhaar OTP',
          state,
          completed: true,
          quickChecklist: completionChecklist(state),
        }));
      }

      state.step = nextStep;
      const next = defs[nextStep];
      state.last_field = next.fieldName;
      const assistantText = await buildLiveQuestionText(state, next, '');
      return jsonResponse(res, buildResponse({
        assistantText,
        fieldName: next.portalField,
        fieldHint: next.hint,
        exampleValue: next.exampleValue,
        state,
        completed: false,
      }));
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}
