import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBreakEvenProjection,
  buildCompoundProjection,
  buildLoanSchedule,
  buildSensitivity,
  calculate,
  csvEscape,
} from "../../app/static/js/calculator.js";

test("extra loan payments reduce payoff time and interest", () => {
  const base = buildLoanSchedule({ principal: 10000, annual_rate: 10, months: 24 });
  const faster = buildLoanSchedule(
    { principal: 10000, annual_rate: 10, months: 24 },
    100,
  );
  assert.ok(faster.payoffMonths < base.payoffMonths);
  assert.ok(faster.totalInterest < base.totalInterest);
  assert.equal(faster.rows.at(-1).balance, 0);
});

test("compound projection agrees with the calculator result", () => {
  const values = { principal: 1000, monthly: 100, annual_rate: 6, years: 3 };
  const projection = buildCompoundProjection(values);
  const result = calculate("compound_growth", values);
  assert.equal(projection.length, 3);
  assert.ok(Math.abs(projection.at(-1).endingBalance - result.future) < 0.000001);
});

test("break-even projection includes the break-even volume", () => {
  const rows = buildBreakEvenProjection({ fixed: 5000, price: 50, variable: 30 });
  const breakEven = rows.find((row) => row.units === 250);
  assert.ok(breakEven);
  assert.equal(breakEven.profit, 0);
});

test("sensitivity keeps the current primary result as the baseline", () => {
  const values = { cost: 100, selling: 150 };
  const rows = buildSensitivity("profit_margin", values, "profit");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].base, 50);
  assert.equal(rows[1].base, 50);
});

test("csvEscape quotes commas, quotes, and newlines", () => {
  assert.equal(csvEscape("plain"), "plain");
  assert.equal(csvEscape('A, "B"'), '"A, ""B"""');
  assert.equal(csvEscape("one\ntwo"), '"one\ntwo"');
});
