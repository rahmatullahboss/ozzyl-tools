import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBreakEvenProjection,
  buildSensitivity,
  csvEscape,
} from "../../app/static/js/calculator.js";

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
