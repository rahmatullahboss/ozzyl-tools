import test from "node:test";
import assert from "node:assert/strict";

import {
  applyStress,
  buildCagrProjection,
  buildNpvProjection,
  calculateCagr,
  calculateNpv,
  calculateNpvIrr,
  calculateSavingsGoal,
  calculateTargetMargin,
  estimateIrr,
  parseCashFlows,
} from "../../app/static/js/advanced-calculators.js";

test("parseCashFlows accepts commas, semicolons, and new lines", () => {
  assert.deepEqual(parseCashFlows("100, 200;\n300"), [100, 200, 300]);
  assert.throws(() => parseCashFlows("100, nope"), /valid numbers/);
});

test("savings goal returns the zero-rate monthly contribution", () => {
  const result = calculateSavingsGoal({ goal: 13000, initial: 1000, years: 1, annual_rate: 0 });
  assert.equal(result.monthly, 1000);
  assert.equal(result.contributed, 13000);
});

test("CAGR matches a simple doubling example", () => {
  const result = calculateCagr({ beginning: 100, ending: 200, years: 2 });
  assert.ok(Math.abs(result.cagr - 41.421356) < 0.0001);
  assert.equal(buildCagrProjection({ beginning: 100, ending: 200, years: 2 }).length, 3);
});

test("NPV and IRR helpers evaluate a conventional investment", () => {
  const flows = [400, 400, 400];
  assert.ok(calculateNpv(1000, 10, flows) < 0);
  const irr = estimateIrr(1000, flows);
  assert.ok(irr > 9 && irr < 10);
  const result = calculateNpvIrr({ initial: 1000, discount_rate: 5, cash_flows: flows });
  assert.ok(result.npv > 0);
  assert.equal(buildNpvProjection({ initial: 1000, discount_rate: 5, cash_flows: flows }).length, 3);
});

test("target margin pricing protects margin after discount", () => {
  const result = calculateTargetMargin({ cost: 70, target_margin: 30, discount: 20, tax: 10 });
  assert.ok(Math.abs(result.sale_price - 100) < 1e-9);
  assert.ok(Math.abs(result.list_price - 125) < 1e-9);
  assert.ok(Math.abs(result.customer_price - 110) < 1e-9);
});

test("stress adjustment changes the selected driver only", () => {
  assert.deepEqual(applyStress({ cost: 100, margin: 30 }, "cost", -20), { cost: 80, margin: 30 });
});
