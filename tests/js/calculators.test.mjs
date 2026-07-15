import test from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../../app/static/js/calculator.js";

const closeTo = (actual, expected, tolerance = 0.001) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`);

test("profit margin and markup", () => {
  const result = calculate("profit_margin", { cost: 100, selling: 150 });
  closeTo(result.profit, 50);
  closeTo(result.margin, 33.333333);
  closeTo(result.markup, 50);
});

test("loan payment handles interest and zero-rate loans", () => {
  closeTo(calculate("loan", { principal: 1200, annual_rate: 0, months: 12 }).monthly, 100);
  closeTo(calculate("loan", { principal: 10000, annual_rate: 10, months: 12 }).monthly, 879.1588, 0.01);
});

test("break-even rounds required units upward", () => {
  assert.equal(calculate("break_even", { fixed: 5000, price: 50, variable: 30 }).units, 250);
  assert.equal(calculate("break_even", { fixed: 5010, price: 50, variable: 30 }).units, 251);
});

test("reorder point includes safety stock", () => {
  const result = calculate("reorder_point", { daily_usage: 12, lead_days: 7, safety_stock: 25 });
  assert.equal(result.reorder, 109);
  assert.equal(result.lead_demand, 84);
});

test("compound growth preserves contributions at zero growth", () => {
  const result = calculate("compound_growth", { principal: 1000, monthly: 100, annual_rate: 0, years: 1 });
  assert.equal(result.future, 2200);
  assert.equal(result.growth, 0);
});

test("unit economics computes contribution and payback", () => {
  const result = calculate("unit_economics", { revenue: 100, variable_cost: 35, cac: 195 });
  assert.equal(result.contribution, 65);
  assert.equal(result.margin, 65);
  assert.equal(result.payback, 3);
});
