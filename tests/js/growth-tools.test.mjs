import assert from "node:assert/strict";
import test from "node:test";
import {
  applyGrowthStress,
  buildClvProjection,
  buildReorderProjection,
  calculateClv,
  calculateReorderPoint,
  calculateRoas,
  calculateRoi,
} from "../../app/static/js/growth-core.js";

test("ROI calculates profit and annualized return", () => {
  const result = calculateRoi({ investment: 1000, return_value: 1250, months: 12 });
  assert.equal(result.net_profit, 250);
  assert.equal(result.roi, 25);
  assert.equal(result.annualized_roi, 25);
});

test("ROAS includes margin-aware break-even", () => {
  const result = calculateRoas({ ad_spend: 1000, revenue: 4000, gross_margin: 40, target_profit: 500 });
  assert.equal(result.roas, 4);
  assert.equal(result.contribution_profit, 600);
  assert.equal(result.break_even_roas, 2.5);
  assert.equal(result.required_revenue, 3750);
});

test("CLV subtracts acquisition cost", () => {
  const result = calculateClv({
    average_order_value: 100,
    purchases_per_year: 4,
    gross_margin: 50,
    lifespan_years: 3,
    acquisition_cost: 150,
  });
  assert.equal(result.gross_clv, 600);
  assert.equal(result.net_clv, 450);
  assert.equal(result.clv_cac_ratio, 4);
  assert.equal(result.payback_orders, 3);
});

test("CLV projection grows by year", () => {
  const rows = buildClvProjection({
    average_order_value: 100,
    purchases_per_year: 2,
    gross_margin: 50,
    lifespan_years: 2,
    acquisition_cost: 50,
  });
  assert.deepEqual(rows.map((row) => row.netValue), [50, 150]);
});

test("reorder point uses demand, lead time, and safety stock", () => {
  const result = calculateReorderPoint({
    daily_demand: 10,
    lead_time_days: 7,
    safety_stock: 20,
    order_quantity: 100,
    unit_cost: 5,
  });
  assert.equal(result.reorder_point, 90);
  assert.equal(result.days_of_cover, 9);
  assert.equal(result.order_value, 500);
  assert.equal(result.annual_orders, 36.5);
});

test("reorder projection reacts to demand", () => {
  const rows = buildReorderProjection({
    daily_demand: 10,
    lead_time_days: 5,
    safety_stock: 10,
    order_quantity: 100,
    unit_cost: 1,
  });
  assert.equal(rows[0].reorderPoint, 50);
  assert.equal(rows.at(-1).reorderPoint, 70);
});

test("stress adjustment preserves other inputs", () => {
  const stressed = applyGrowthStress({ revenue: 100, spend: 20 }, "revenue", -10);
  assert.equal(stressed.revenue, 90);
  assert.equal(stressed.spend, 20);
});
