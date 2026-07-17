const percent = (value) => Number(value || 0) / 100;
const finite = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function calculateRoi({ investment, return_value, months }) {
  const cost = Math.max(0, finite(investment));
  const returned = Math.max(0, finite(return_value));
  const duration = Math.max(0, finite(months));
  const netProfit = returned - cost;
  const roi = cost === 0 ? 0 : (netProfit / cost) * 100;
  const annualized = cost > 0 && duration > 0
    ? ((returned / cost) ** (12 / duration) - 1) * 100
    : 0;
  return {
    roi,
    net_profit: netProfit,
    annualized_roi: Number.isFinite(annualized) ? annualized : 0,
    break_even_return: cost,
  };
}

export function buildRoiProjection(values) {
  const returned = Math.max(0, finite(values.return_value));
  return [-20, -10, 0, 10, 20].map((change) => {
    const scenario = calculateRoi({
      ...values,
      return_value: returned * (1 + change / 100),
    });
    return {
      period: `${change > 0 ? "+" : ""}${change}% return`,
      returnValue: returned * (1 + change / 100),
      netProfit: scenario.net_profit,
      roi: scenario.roi,
      annualized: scenario.annualized_roi,
      chartValue: scenario.roi,
    };
  });
}

export function calculateRoas({ ad_spend, revenue, gross_margin, target_profit }) {
  const spend = Math.max(0, finite(ad_spend));
  const sales = Math.max(0, finite(revenue));
  const margin = clamp(percent(gross_margin), 0, 1);
  const target = Math.max(0, finite(target_profit));
  const grossProfit = sales * margin;
  return {
    roas: spend === 0 ? 0 : sales / spend,
    contribution_profit: grossProfit - spend,
    break_even_roas: margin === 0 ? 0 : 1 / margin,
    required_revenue: margin === 0 ? 0 : (spend + target) / margin,
  };
}

export function buildRoasProjection(values) {
  const revenue = Math.max(0, finite(values.revenue));
  return [-30, -15, 0, 15, 30].map((change) => {
    const sales = revenue * (1 + change / 100);
    const result = calculateRoas({ ...values, revenue: sales });
    return {
      period: `${change > 0 ? "+" : ""}${change}% revenue`,
      revenue: sales,
      roas: result.roas,
      contribution: result.contribution_profit,
      requiredRevenue: result.required_revenue,
      chartValue: result.contribution_profit,
    };
  });
}

export function calculateClv({
  average_order_value,
  purchases_per_year,
  gross_margin,
  lifespan_years,
  acquisition_cost,
}) {
  const orderValue = Math.max(0, finite(average_order_value));
  const frequency = Math.max(0, finite(purchases_per_year));
  const margin = clamp(percent(gross_margin), 0, 1);
  const lifespan = Math.max(0, finite(lifespan_years));
  const cac = Math.max(0, finite(acquisition_cost));
  const annualRevenue = orderValue * frequency;
  const grossClv = annualRevenue * margin * lifespan;
  const contributionPerOrder = orderValue * margin;
  return {
    net_clv: grossClv - cac,
    gross_clv: grossClv,
    clv_cac_ratio: cac === 0 ? 0 : grossClv / cac,
    payback_orders: contributionPerOrder === 0 ? 0 : cac / contributionPerOrder,
  };
}

export function buildClvProjection(values) {
  const years = Math.max(1, Math.ceil(finite(values.lifespan_years)));
  const orderValue = Math.max(0, finite(values.average_order_value));
  const frequency = Math.max(0, finite(values.purchases_per_year));
  const margin = clamp(percent(values.gross_margin), 0, 1);
  const cac = Math.max(0, finite(values.acquisition_cost));
  return Array.from({ length: years }, (_, index) => {
    const year = index + 1;
    const cumulativeRevenue = orderValue * frequency * year;
    const grossProfit = cumulativeRevenue * margin;
    return {
      period: `Year ${year}`,
      cumulativeRevenue,
      grossProfit,
      netValue: grossProfit - cac,
      chartValue: grossProfit - cac,
    };
  });
}

export function calculateReorderPoint({
  daily_demand,
  lead_time_days,
  safety_stock,
  order_quantity,
  unit_cost,
}) {
  const demand = Math.max(0, finite(daily_demand));
  const leadTime = Math.max(0, finite(lead_time_days));
  const safety = Math.max(0, finite(safety_stock));
  const quantity = Math.max(0, finite(order_quantity));
  const cost = Math.max(0, finite(unit_cost));
  const reorderPoint = demand * leadTime + safety;
  return {
    reorder_point: reorderPoint,
    days_of_cover: demand === 0 ? 0 : reorderPoint / demand,
    order_value: quantity * cost,
    annual_orders: quantity === 0 ? 0 : (demand * 365) / quantity,
  };
}

export function buildReorderProjection(values) {
  const demand = Math.max(0, finite(values.daily_demand));
  return [-20, -10, 0, 10, 20].map((change) => {
    const scenarioDemand = demand * (1 + change / 100);
    const result = calculateReorderPoint({ ...values, daily_demand: scenarioDemand });
    return {
      period: `${change > 0 ? "+" : ""}${change}% demand`,
      dailyDemand: scenarioDemand,
      reorderPoint: result.reorder_point,
      annualUnits: scenarioDemand * 365,
      annualOrders: result.annual_orders,
      chartValue: result.reorder_point,
    };
  });
}

export const growthCalculators = {
  roi: calculateRoi,
  roas: calculateRoas,
  clv: calculateClv,
  reorder_point: calculateReorderPoint,
};

export function calculateGrowth(formula, values) {
  const calculator = growthCalculators[formula];
  if (!calculator) throw new Error(`Unknown growth calculator: ${formula}`);
  return Object.fromEntries(
    Object.entries(calculator(values)).map(([key, value]) => [key, finite(value)]),
  );
}

export function buildGrowthProjection(formula, values) {
  if (formula === "roi") return buildRoiProjection(values);
  if (formula === "roas") return buildRoasProjection(values);
  if (formula === "clv") return buildClvProjection(values);
  if (formula === "reorder_point") return buildReorderProjection(values);
  return [];
}

export function applyGrowthStress(values, key, changePercent) {
  const current = finite(values[key]);
  return {
    ...values,
    [key]: current === 0
      ? finite(changePercent) / 10
      : current * (1 + finite(changePercent) / 100),
  };
}

export function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
