import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDebtSchedule,
  calculateDebtPayoff,
  calculateDti,
  calculateLtv,
  calculateMortgageAffordability,
  monthlyPayment,
  principalFromPayment,
} from "../../app/static/js/finance-core.js";

test("monthly payment and principal conversion are inverse calculations", () => {
  const payment = monthlyPayment(250000, 6.5, 360);
  assert.ok(Math.abs(principalFromPayment(payment, 6.5, 360) - 250000) < 0.01);
});

test("DTI returns front-end, back-end and remaining capacity", () => {
  const result = calculateDti({ gross_income: 6000, housing: 1500, other_debt: 500, target_dti: 36 });
  assert.equal(result.front_end, 25);
  assert.ok(Math.abs(result.back_end - 33.3333333333) < 1e-6);
  assert.equal(result.remaining_capacity, 160);
});

test("combined LTV includes primary and secondary loans", () => {
  const result = calculateLtv({ property_value: 300000, primary_loan: 200000, secondary_loan: 10000, target_ltv: 80 });
  assert.equal(result.ltv, 70);
  assert.equal(result.equity, 90000);
  assert.equal(result.additional_capacity, 30000);
});

test("mortgage affordability respects taxes, debt and down payment", () => {
  const result = calculateMortgageAffordability({ gross_income: 8000, monthly_debt: 750, annual_rate: 7, years: 30, down_payment: 50000, monthly_tax_insurance: 550, target_dti: 36 });
  assert.equal(result.housing_budget, 2130);
  assert.equal(result.principal_interest, 1580);
  assert.ok(result.home_price > result.loan_amount);
});

test("extra payment reduces payoff time and interest", () => {
  const base = buildDebtSchedule({ balance: 15000, annual_rate: 18, monthly_payment: 450, extra_payment: 0 });
  const accelerated = buildDebtSchedule({ balance: 15000, annual_rate: 18, monthly_payment: 450, extra_payment: 100 });
  assert.ok(accelerated.months < base.months);
  assert.ok(accelerated.totalInterest < base.totalInterest);
  const result = calculateDebtPayoff({ balance: 15000, annual_rate: 18, monthly_payment: 450, extra_payment: 100 });
  assert.equal(result.months_saved, base.months - accelerated.months);
});

test("debt payoff rejects a payment that cannot reduce principal", () => {
  assert.throws(() => buildDebtSchedule({ balance: 10000, annual_rate: 24, monthly_payment: 100, extra_payment: 0 }), /greater than the first month's interest/);
});
