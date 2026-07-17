const percent = (value) => Number(value || 0) / 100;
const finite = (value) => (Number.isFinite(value) ? value : 0);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function parseCashFlows(value) {
  const tokens = String(value ?? "")
    .split(/[\n,;]+/u)
    .map((token) => token.trim())
    .filter(Boolean);
  if (!tokens.length) throw new Error("Enter at least one cash flow.");
  const flows = tokens.map(Number);
  if (flows.some((flow) => !Number.isFinite(flow))) {
    throw new Error("Cash flows must be valid numbers separated by commas or new lines.");
  }
  return flows;
}

export function calculateSavingsGoal({ goal, initial, years, annual_rate }) {
  const target = Math.max(0, Number(goal) || 0);
  const starting = Math.max(0, Number(initial) || 0);
  const months = Math.max(1, Math.round((Number(years) || 0) * 12));
  const rate = percent(annual_rate) / 12;
  const startingFuture = starting * (1 + rate) ** months;
  const shortfall = Math.max(0, target - starting);
  let monthly = 0;
  if (target > startingFuture) {
    monthly = rate === 0
      ? (target - startingFuture) / months
      : ((target - startingFuture) * rate) / ((1 + rate) ** months - 1);
  }
  monthly = Math.max(0, monthly);
  const contributionFuture =
    rate === 0 ? monthly * months : monthly * (((1 + rate) ** months - 1) / rate);
  const projectedFuture = startingFuture + contributionFuture;
  const contributed = starting + monthly * months;
  return {
    monthly,
    contributed,
    growth: projectedFuture - contributed,
    shortfall,
  };
}

export function buildSavingsProjection(values) {
  const result = calculateSavingsGoal(values);
  const months = Math.max(1, Math.round((Number(values.years) || 0) * 12));
  const rate = percent(values.annual_rate) / 12;
  let balance = Math.max(0, Number(values.initial) || 0);
  const rows = [];
  let yearStart = balance;
  let contributed = 0;
  let growth = 0;
  for (let month = 1; month <= months; month += 1) {
    const earned = balance * rate;
    balance += earned + result.monthly;
    contributed += result.monthly;
    growth += earned;
    if (month % 12 === 0 || month === months) {
      rows.push({
        period: `Year ${Math.ceil(month / 12)}`,
        starting: yearStart,
        contribution: contributed,
        growth,
        ending: balance,
        chartValue: balance,
      });
      yearStart = balance;
      contributed = 0;
      growth = 0;
    }
  }
  return rows;
}

export function calculateCagr({ beginning, ending, years }) {
  const start = Number(beginning) || 0;
  const finish = Number(ending) || 0;
  const duration = Number(years) || 0;
  const cagr = start > 0 && finish >= 0 && duration > 0
    ? ((finish / start) ** (1 / duration) - 1) * 100
    : 0;
  return {
    cagr,
    absolute_growth: finish - start,
    total_growth: start === 0 ? 0 : ((finish - start) / start) * 100,
    multiple: start === 0 ? 0 : finish / start,
  };
}

export function buildCagrProjection(values) {
  const result = calculateCagr(values);
  const years = Math.max(1, Math.ceil(Number(values.years) || 0));
  const start = Math.max(0, Number(values.beginning) || 0);
  const rate = percent(result.cagr);
  return Array.from({ length: years + 1 }, (_, year) => {
    const value = start * (1 + rate) ** year;
    return {
      period: `Year ${year}`,
      value,
      growth: value - start,
      chartValue: value,
    };
  });
}

export function calculateNpv(initial, discountRate, cashFlows) {
  const investment = Math.max(0, Number(initial) || 0);
  const rate = percent(discountRate);
  return cashFlows.reduce(
    (total, cashFlow, index) => total + cashFlow / (1 + rate) ** (index + 1),
    -investment,
  );
}

export function estimateIrr(initial, cashFlows) {
  const investment = Math.max(0, Number(initial) || 0);
  const npvAt = (rate) =>
    cashFlows.reduce(
      (total, cashFlow, index) => total + cashFlow / (1 + rate) ** (index + 1),
      -investment,
    );
  let low = -0.9999;
  let high = 10;
  let lowValue = npvAt(low);
  let highValue = npvAt(high);
  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue) || lowValue * highValue > 0) {
    return 0;
  }
  for (let iteration = 0; iteration < 160; iteration += 1) {
    const middle = (low + high) / 2;
    const middleValue = npvAt(middle);
    if (Math.abs(middleValue) < 1e-8) return middle * 100;
    if (lowValue * middleValue <= 0) {
      high = middle;
      highValue = middleValue;
    } else {
      low = middle;
      lowValue = middleValue;
    }
  }
  return ((low + high) / 2) * 100;
}

export function simplePayback(initial, cashFlows) {
  const investment = Math.max(0, Number(initial) || 0);
  if (investment === 0) return 0;
  let recovered = 0;
  for (let index = 0; index < cashFlows.length; index += 1) {
    const flow = cashFlows[index];
    if (flow <= 0) {
      recovered += flow;
      continue;
    }
    if (recovered + flow >= investment) {
      return index + (investment - recovered) / flow;
    }
    recovered += flow;
  }
  return 0;
}

export function calculateNpvIrr({ initial, discount_rate, cash_flows }) {
  const flows = Array.isArray(cash_flows) ? cash_flows : parseCashFlows(cash_flows);
  const investment = Math.max(0, Number(initial) || 0);
  const presentValue = flows.reduce(
    (total, flow, index) => total + flow / (1 + percent(discount_rate)) ** (index + 1),
    0,
  );
  return {
    npv: presentValue - investment,
    irr: estimateIrr(investment, flows),
    profitability: investment === 0 ? 0 : presentValue / investment,
    payback: simplePayback(investment, flows),
  };
}

export function buildNpvProjection(values) {
  const flows = Array.isArray(values.cash_flows)
    ? values.cash_flows
    : parseCashFlows(values.cash_flows);
  const rate = percent(values.discount_rate);
  let cumulative = -Math.max(0, Number(values.initial) || 0);
  return flows.map((cashFlow, index) => {
    const discountFactor = 1 / (1 + rate) ** (index + 1);
    const presentValue = cashFlow * discountFactor;
    cumulative += presentValue;
    return {
      period: `Year ${index + 1}`,
      cashFlow,
      discountFactor,
      presentValue,
      cumulative,
      chartValue: cumulative,
    };
  });
}

export function calculateTargetMargin({ cost, target_margin, discount, tax }) {
  const unitCost = Math.max(0, Number(cost) || 0);
  const marginRate = clamp(percent(target_margin), 0, 0.999);
  const discountRate = clamp(percent(discount), 0, 0.999);
  const taxRate = Math.max(0, percent(tax));
  const salePrice = unitCost / (1 - marginRate);
  const listPrice = salePrice / (1 - discountRate);
  const customerPrice = salePrice * (1 + taxRate);
  return {
    list_price: listPrice,
    sale_price: salePrice,
    customer_price: customerPrice,
    profit: salePrice - unitCost,
  };
}

export function buildPricingProjection(values) {
  const unitCost = Math.max(0, Number(values.cost) || 0);
  const targetMargin = clamp(percent(values.target_margin), 0, 0.999);
  const taxRate = Math.max(0, percent(values.tax));
  const discounts = [0, Number(values.discount) || 0, 15, 20, 25]
    .map((value) => clamp(value, 0, 99.9))
    .filter((value, index, list) => list.indexOf(value) === index)
    .sort((a, b) => a - b);
  const protectedSalePrice = unitCost / (1 - targetMargin);
  return discounts.map((discount) => {
    const listPrice = protectedSalePrice / (1 - percent(discount));
    return {
      period: `${discount}% discount`,
      listPrice,
      salePrice: protectedSalePrice,
      customerPrice: protectedSalePrice * (1 + taxRate),
      profit: protectedSalePrice - unitCost,
      chartValue: listPrice,
    };
  });
}

export const advancedCalculators = {
  savings_goal: calculateSavingsGoal,
  cagr: calculateCagr,
  npv: calculateNpvIrr,
  target_margin: calculateTargetMargin,
};

export function calculateAdvanced(formula, values) {
  const calculator = advancedCalculators[formula];
  if (!calculator) throw new Error(`Unknown advanced calculator: ${formula}`);
  const result = calculator(values);
  return Object.fromEntries(
    Object.entries(result).map(([key, value]) => [key, finite(Number(value))]),
  );
}

export function buildProjection(formula, values) {
  if (formula === "savings_goal") return buildSavingsProjection(values);
  if (formula === "cagr") return buildCagrProjection(values);
  if (formula === "npv") return buildNpvProjection(values);
  if (formula === "target_margin") return buildPricingProjection(values);
  return [];
}

export function applyStress(values, key, changePercent) {
  const current = Number(values[key]) || 0;
  const adjusted = current === 0
    ? Number(changePercent) / 10
    : current * (1 + Number(changePercent) / 100);
  return { ...values, [key]: adjusted };
}

export function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
