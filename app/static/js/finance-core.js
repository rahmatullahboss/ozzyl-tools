const percent = (value) => Number(value || 0) / 100;
const finite = (value) => (Number.isFinite(value) ? value : 0);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function monthlyPayment(principal, annualRate, months) {
  const amount = Math.max(0, Number(principal) || 0);
  const periods = Math.max(1, Math.round(Number(months) || 1));
  const rate = Math.max(0, percent(annualRate) / 12);
  if (rate === 0) return amount / periods;
  return (amount * rate * (1 + rate) ** periods) / ((1 + rate) ** periods - 1);
}

export function principalFromPayment(payment, annualRate, months) {
  const monthly = Math.max(0, Number(payment) || 0);
  const periods = Math.max(1, Math.round(Number(months) || 1));
  const rate = Math.max(0, percent(annualRate) / 12);
  if (rate === 0) return monthly * periods;
  return monthly * (1 - (1 + rate) ** -periods) / rate;
}

export function calculateDti({ gross_income, housing, other_debt, target_dti }) {
  const income = Math.max(0, Number(gross_income) || 0);
  const housingPayment = Math.max(0, Number(housing) || 0);
  const other = Math.max(0, Number(other_debt) || 0);
  const totalDebt = housingPayment + other;
  const target = clamp(percent(target_dti), 0, 1);
  return {
    back_end: income === 0 ? 0 : (totalDebt / income) * 100,
    front_end: income === 0 ? 0 : (housingPayment / income) * 100,
    total_debt: totalDebt,
    remaining_capacity: Math.max(0, income * target - totalDebt),
  };
}

export function buildDtiProjection(values) {
  const income = Math.max(0, Number(values.gross_income) || 0);
  const totalDebt = Math.max(0, Number(values.housing) || 0) + Math.max(0, Number(values.other_debt) || 0);
  const targets = [25, 30, 36, 43, 50, Number(values.target_dti) || 0]
    .map((value) => clamp(value, 0, 100))
    .filter((value, index, list) => list.indexOf(value) === index)
    .sort((a, b) => a - b);
  return targets.map((target) => {
    const allowed = income * percent(target);
    return {
      period: `${target}% target`,
      allowed,
      current: totalDebt,
      remaining: allowed - totalDebt,
      chartValue: allowed - totalDebt,
    };
  });
}

export function calculateLtv({ property_value, primary_loan, secondary_loan, target_ltv }) {
  const value = Math.max(0, Number(property_value) || 0);
  const totalLoan = Math.max(0, Number(primary_loan) || 0) + Math.max(0, Number(secondary_loan) || 0);
  const target = clamp(percent(target_ltv), 0, 1);
  return {
    ltv: value === 0 ? 0 : (totalLoan / value) * 100,
    equity: value - totalLoan,
    total_loan: totalLoan,
    additional_capacity: Math.max(0, value * target - totalLoan),
  };
}

export function buildLtvProjection(values) {
  const currentValue = Math.max(0, Number(values.property_value) || 0);
  const totalLoan = Math.max(0, Number(values.primary_loan) || 0) + Math.max(0, Number(values.secondary_loan) || 0);
  return [-20, -10, 0, 10, 20].map((change) => {
    const propertyValue = currentValue * (1 + change / 100);
    return {
      period: `${change > 0 ? "+" : ""}${change}% value`,
      propertyValue,
      totalLoan,
      ltv: propertyValue === 0 ? 0 : (totalLoan / propertyValue) * 100,
      equity: propertyValue - totalLoan,
      chartValue: propertyValue - totalLoan,
    };
  });
}

export function calculateMortgageAffordability({ gross_income, monthly_debt, annual_rate, years, down_payment, monthly_tax_insurance, target_dti }) {
  const income = Math.max(0, Number(gross_income) || 0);
  const debt = Math.max(0, Number(monthly_debt) || 0);
  const target = clamp(percent(target_dti), 0, 1);
  const nonPrincipalHousing = Math.max(0, Number(monthly_tax_insurance) || 0);
  const housingBudget = Math.max(0, income * target - debt);
  const principalInterest = Math.max(0, housingBudget - nonPrincipalHousing);
  const months = Math.max(1, Math.round((Number(years) || 0) * 12));
  const loanAmount = principalFromPayment(principalInterest, annual_rate, months);
  const homePrice = loanAmount + Math.max(0, Number(down_payment) || 0);
  return { home_price: homePrice, loan_amount: loanAmount, housing_budget: housingBudget, principal_interest: principalInterest };
}

export function buildMortgageProjection(values) {
  const baseRate = Math.max(0, Number(values.annual_rate) || 0);
  const rates = [baseRate - 2, baseRate - 1, baseRate, baseRate + 1, baseRate + 2]
    .map((rate) => Math.max(0, rate))
    .filter((rate, index, list) => list.indexOf(rate) === index);
  return rates.map((rate) => {
    const result = calculateMortgageAffordability({ ...values, annual_rate: rate });
    return { period: `${rate.toFixed(2)}% rate`, rate, homePrice: result.home_price, loanAmount: result.loan_amount, payment: result.principal_interest, chartValue: result.home_price };
  });
}

export function buildDebtSchedule({ balance, annual_rate, monthly_payment, extra_payment = 0 }) {
  const openingBalance = Math.max(0, Number(balance) || 0);
  const rate = Math.max(0, percent(annual_rate) / 12);
  const scheduled = Math.max(0, Number(monthly_payment) || 0);
  const extra = Math.max(0, Number(extra_payment) || 0);
  const payment = scheduled + extra;
  if (openingBalance > 0 && payment <= openingBalance * rate) throw new Error("The monthly payment must be greater than the first month's interest.");
  const rows = [];
  let remaining = openingBalance;
  let totalInterest = 0;
  let totalPaid = 0;
  for (let month = 1; remaining > 0.005 && month <= 1200; month += 1) {
    const interest = remaining * rate;
    const principal = Math.min(remaining, payment - interest);
    const actualPayment = principal + interest;
    remaining = Math.max(0, remaining - principal);
    totalInterest += interest;
    totalPaid += actualPayment;
    rows.push({ month, payment: actualPayment, principal, interest, balance: remaining });
  }
  return { rows, months: rows.length, totalInterest, totalPaid, payment };
}

export function calculateDebtPayoff(values) {
  const accelerated = buildDebtSchedule(values);
  const baseline = buildDebtSchedule({ ...values, extra_payment: 0 });
  return { months: accelerated.months, total_interest: accelerated.totalInterest, total_paid: accelerated.totalPaid, months_saved: Math.max(0, baseline.months - accelerated.months) };
}

export function buildDebtProjection(values) {
  const schedule = buildDebtSchedule(values);
  const rows = [];
  let yearStart = Math.max(0, Number(values.balance) || 0);
  let paid = 0;
  let interest = 0;
  for (const entry of schedule.rows) {
    paid += entry.payment;
    interest += entry.interest;
    if (entry.month % 12 === 0 || entry.month === schedule.rows.length) {
      rows.push({ period: `Year ${Math.ceil(entry.month / 12)}`, starting: yearStart, paid, interest, ending: entry.balance, chartValue: entry.balance });
      yearStart = entry.balance;
      paid = 0;
      interest = 0;
    }
  }
  return rows;
}

export const financeCalculators = { dti: calculateDti, ltv: calculateLtv, mortgage_affordability: calculateMortgageAffordability, debt_payoff: calculateDebtPayoff };

export function calculateFinance(formula, values) {
  const calculator = financeCalculators[formula];
  if (!calculator) throw new Error(`Unknown finance calculator: ${formula}`);
  const result = calculator(values);
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, finite(Number(value))]));
}

export function buildFinanceProjection(formula, values) {
  if (formula === "dti") return buildDtiProjection(values);
  if (formula === "ltv") return buildLtvProjection(values);
  if (formula === "mortgage_affordability") return buildMortgageProjection(values);
  if (formula === "debt_payoff") return buildDebtProjection(values);
  return [];
}

export function applyFinanceStress(values, key, changePercent) {
  const current = Number(values[key]) || 0;
  const adjusted = current === 0 ? Number(changePercent) / 10 : current * (1 + Number(changePercent) / 100);
  return { ...values, [key]: adjusted };
}

export function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
