import { showToast } from "./app.js";

const finite = (value) => (Number.isFinite(value) ? value : 0);
const percent = (value) => value / 100;

export const calculators = {
  profit_margin: ({ cost, selling }) => ({
    profit: selling - cost,
    margin: selling === 0 ? 0 : ((selling - cost) / selling) * 100,
    markup: cost === 0 ? 0 : ((selling - cost) / cost) * 100,
  }),
  markup: ({ cost, markup }) => {
    const selling = cost * (1 + percent(markup));
    return {
      selling,
      profit: selling - cost,
      margin: selling === 0 ? 0 : ((selling - cost) / selling) * 100,
    };
  },
  discount: ({ price, discount }) => {
    const savings = price * percent(discount);
    return {
      final: price - savings,
      savings,
      effective: price === 0 ? 0 : (savings / price) * 100,
    };
  },
  commission: ({ sales, rate, base }) => {
    const commission = sales * percent(rate);
    return { commission, payout: commission + base, net: sales - commission };
  },
  vat: ({ amount, rate }) => ({
    vat: amount * percent(rate),
    gross: amount * (1 + percent(rate)),
    included: rate <= -100 ? 0 : amount - amount / (1 + percent(rate)),
  }),
  break_even: ({ fixed, price, variable }) => {
    const contribution = price - variable;
    const units = contribution > 0 ? Math.ceil(fixed / contribution) : 0;
    return { units, revenue: units * price, contribution };
  },
  loan: ({ principal, annual_rate, months }) => {
    const schedule = buildLoanSchedule({ principal, annual_rate, months });
    return {
      monthly: schedule.scheduledPayment,
      total: schedule.totalPaid,
      interest: schedule.totalInterest,
    };
  },
  overtime: ({ hourly, regular_hours, overtime_hours, multiplier }) => ({
    regular: hourly * regular_hours,
    overtime: hourly * overtime_hours * multiplier,
    total: hourly * regular_hours + hourly * overtime_hours * multiplier,
  }),
  roi: ({ investment, return_value }) => ({
    profit: return_value - investment,
    roi: investment === 0 ? 0 : ((return_value - investment) / investment) * 100,
    multiple: investment === 0 ? 0 : return_value / investment,
  }),
  cash_runway: ({ cash, monthly_burn }) => {
    const months = monthly_burn > 0 ? cash / monthly_burn : 0;
    return {
      months,
      days: Math.floor(months * 30.4375),
      six_month_need: monthly_burn * 6,
    };
  },
  reorder_point: ({ daily_usage, lead_days, safety_stock }) => {
    const lead_demand = daily_usage * lead_days;
    return {
      reorder: lead_demand + safety_stock,
      lead_demand,
      coverage: daily_usage > 0 ? safety_stock / daily_usage : 0,
    };
  },
  compound_growth: ({ principal, monthly, annual_rate, years }) => {
    const projection = buildCompoundProjection({
      principal,
      monthly,
      annual_rate,
      years,
    });
    const final = projection.at(-1);
    const periods = Math.max(0, Math.round(years * 12));
    const future = final?.endingBalance ?? principal;
    const contributed = principal + monthly * periods;
    return { future, contributed, growth: future - contributed };
  },
  unit_economics: ({ revenue, variable_cost, cac }) => {
    const contribution = revenue - variable_cost;
    return {
      contribution,
      margin: revenue === 0 ? 0 : (contribution / revenue) * 100,
      payback: contribution > 0 ? cac / contribution : 0,
    };
  },
};

export function calculate(formula, values) {
  const handler = calculators[formula];
  if (!handler) throw new Error(`Unknown calculator: ${formula}`);
  return Object.fromEntries(
    Object.entries(handler(values)).map(([key, value]) => [key, finite(value)]),
  );
}

export function buildLoanSchedule(
  { principal, annual_rate, months },
  extraPayment = 0,
) {
  const openingPrincipal = Math.max(0, Number(principal) || 0);
  const term = Math.max(1, Math.round(Number(months) || 1));
  const monthlyRate = Math.max(0, percent(Number(annual_rate) || 0) / 12);
  const scheduledPayment =
    monthlyRate === 0
      ? openingPrincipal / term
      : (openingPrincipal * monthlyRate * (1 + monthlyRate) ** term) /
        ((1 + monthlyRate) ** term - 1);
  const payment = scheduledPayment + Math.max(0, Number(extraPayment) || 0);
  const rows = [];
  let balance = openingPrincipal;
  let totalInterest = 0;
  let totalPaid = 0;
  const maximumPeriods = Math.max(term * 5, 1200);

  for (let month = 1; balance > 0.005 && month <= maximumPeriods; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(balance, Math.max(0, payment - interest));
    if (principalPaid <= 0 && balance > 0) {
      throw new Error("The payment is not high enough to reduce the loan balance.");
    }
    const actualPayment = interest + principalPaid;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    totalPaid += actualPayment;
    rows.push({
      month,
      payment: actualPayment,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  return {
    scheduledPayment,
    payment,
    rows,
    totalInterest,
    totalPaid,
    payoffMonths: rows.length,
  };
}

export function buildCompoundProjection({ principal, monthly, annual_rate, years }) {
  const initial = Math.max(0, Number(principal) || 0);
  const contribution = Number(monthly) || 0;
  const periods = Math.max(0, Math.round((Number(years) || 0) * 12));
  const monthlyRate = percent(Number(annual_rate) || 0) / 12;
  const rows = [];
  let balance = initial;
  let yearStart = balance;
  let yearContributions = 0;
  let yearGrowth = 0;

  for (let month = 1; month <= periods; month += 1) {
    const growth = balance * monthlyRate;
    balance += growth + contribution;
    yearGrowth += growth;
    yearContributions += contribution;
    if (month % 12 === 0 || month === periods) {
      rows.push({
        year: Math.ceil(month / 12),
        startingBalance: yearStart,
        contributions: yearContributions,
        growth: yearGrowth,
        endingBalance: balance,
      });
      yearStart = balance;
      yearContributions = 0;
      yearGrowth = 0;
    }
  }

  return rows;
}

export function buildBreakEvenProjection({ fixed, price, variable }) {
  const fixedCosts = Math.max(0, Number(fixed) || 0);
  const sellingPrice = Math.max(0, Number(price) || 0);
  const variableCost = Math.max(0, Number(variable) || 0);
  const contribution = sellingPrice - variableCost;
  if (contribution <= 0) return [];
  const breakEvenUnits = Math.ceil(fixedCosts / contribution);
  const volumes = [
    ...new Set(
      [0, 0.5, 1, 1.25, 1.5].map((factor) =>
        Math.round(breakEvenUnits * factor),
      ),
    ),
  ];
  return volumes.map((units) => {
    const revenue = units * sellingPrice;
    const totalCost = fixedCosts + units * variableCost;
    return { units, revenue, totalCost, profit: revenue - totalCost };
  });
}

export function buildCashRunwayProjection({ cash, monthly_burn }) {
  const openingCash = Math.max(0, Number(cash) || 0);
  const burn = Math.max(0, Number(monthly_burn) || 0);
  if (burn <= 0) return [];
  const rows = [];
  let balance = openingCash;
  const periods = Math.min(120, Math.max(1, Math.ceil(openingCash / burn)));
  for (let month = 1; month <= periods; month += 1) {
    const opening = balance;
    const spent = Math.min(opening, burn);
    balance = Math.max(0, opening - spent);
    rows.push({ month, opening, burn: spent, ending: balance });
  }
  return rows;
}

export function buildSensitivity(formula, values, primaryKey, delta = 0.1) {
  const baseline = calculate(formula, values)[primaryKey];
  return Object.entries(values).map(([input, rawValue]) => {
    const value = Number(rawValue) || 0;
    const lowValue = value === 0 ? 0 : value * (1 - delta);
    const highValue = value === 0 ? 1 : value * (1 + delta);
    return {
      input,
      low: calculate(formula, { ...values, [input]: lowValue })[primaryKey],
      base: baseline,
      high: calculate(formula, { ...values, [input]: highValue })[primaryKey],
    };
  });
}

export function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatter(currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    });
  } catch {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  }
}

function formatResult(value, format, currency) {
  const number = finite(value);
  const compact = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  if (format === "currency") return formatter(currency).format(number);
  if (format === "percent") return `${compact.format(number)}%`;
  if (format === "integer") {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
      number,
    );
  }
  if (format === "multiple") return `${compact.format(number)}×`;
  if (format === "months") return `${compact.format(number)} months`;
  if (format === "days") return `${compact.format(number)} days`;
  if (format === "units") return `${compact.format(number)} units`;
  return compact.format(number);
}

function storageKey(slug) {
  return `ozzyl-calculator:${slug}`;
}

function downloadText(content, filename, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createCell(tag, text) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  return cell;
}

function renderDynamicTable(table, headers, rows) {
  const head = table.querySelector("thead");
  const body = table.querySelector("tbody");
  head.replaceChildren();
  body.replaceChildren();
  const headRow = document.createElement("tr");
  for (const header of headers) headRow.append(createCell("th", header));
  head.append(headRow);
  for (const row of rows) {
    const tr = document.createElement("tr");
    for (const value of row) tr.append(createCell("td", value));
    body.append(tr);
  }
}

function initCalculator(root) {
  const form = root.querySelector("[data-calculator-form]");
  const currencySelect = root.querySelector("[data-currency]");
  const inputs = [...form.querySelectorAll("input[type='number']")];
  const slug = root.dataset.toolSlug;
  const formula = root.dataset.calculator;
  const defaults = Object.fromEntries(
    inputs.map((input) => [input.name, input.value]),
  );
  const resultElements = [...root.querySelectorAll("[data-result]")];
  const resultDefinitions = resultElements.map((output) => ({
    key: output.dataset.result,
    format: output.dataset.format,
    label:
      output.closest("div")?.querySelector("span")?.textContent ||
      output.dataset.result,
  }));
  const primaryKey = resultDefinitions[0]?.key;
  let latestValues = {};
  let latestResult = {};

  const load = () => {
    const params = new URLSearchParams(location.search);
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(storageKey(slug))) || {};
    } catch {
      saved = {};
    }
    for (const input of inputs) {
      input.value = params.get(input.name) ?? saved[input.name] ?? input.value;
    }
    currencySelect.value =
      params.get("currency") ?? saved.currency ?? currencySelect.value;
  };

  const validate = (input) => {
    const value = Number(input.value);
    let message = "";
    if (input.value === "" || !Number.isFinite(value)) {
      message = "Enter a valid number.";
    } else if (input.min !== "" && value < Number(input.min)) {
      message = `Minimum value is ${input.min}.`;
    } else if (input.max !== "" && value > Number(input.max)) {
      message = `Maximum value is ${input.max}.`;
    }
    input.setAttribute("aria-invalid", String(Boolean(message)));
    const error = form.querySelector(`#${CSS.escape(input.id)}-error`);
    if (error) error.textContent = message;
    return !message;
  };

  const updateAffixes = () => {
    const currencySymbol =
      formatter(currencySelect.value)
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value || currencySelect.value;
    for (const input of inputs) {
      const kind = input.closest("[data-kind]")?.dataset.kind;
      const affix = input.parentElement.querySelector(".field-affix");
      const map = {
        money: currencySymbol,
        percent: "%",
        hours: "hrs",
        days: "days",
        years: "yrs",
        units: "units",
      };
      if (affix) affix.textContent = map[kind] || "";
    }
    for (const affix of root.querySelectorAll("[data-advanced-currency-affix]")) {
      affix.textContent = currencySymbol;
    }
  };

  const scenarioToggle = root.querySelector("[data-scenario-toggle]");
  const scenarioPanel = root.querySelector("[data-scenario-panel]");
  const scenarioInputs = [...root.querySelectorAll("[data-scenario-input]")];
  const scenarioTable = root.querySelector("[data-scenario-table]");
  const sensitivityTable = root.querySelector("[data-sensitivity-table]");
  const projectionCard = root.querySelector("[data-projection-card]");
  const projectionTable = root.querySelector("[data-projection-table]");
  const projectionSummary = root.querySelector("[data-projection-summary]");
  const loanExtra = root.querySelector("[data-loan-extra-payment]");

  const scenarioValues = () =>
    Object.fromEntries(
      scenarioInputs.map((input) => [input.name, Number(input.value)]),
    );

  const renderScenario = () => {
    if (!scenarioTable || !scenarioToggle?.checked) {
      if (scenarioTable) scenarioTable.hidden = true;
      return;
    }
    const comparison = calculate(formula, scenarioValues());
    const rows = resultDefinitions.map((definition) => [
      definition.label,
      formatResult(
        latestResult[definition.key],
        definition.format,
        currencySelect.value,
      ),
      formatResult(
        comparison[definition.key],
        definition.format,
        currencySelect.value,
      ),
      formatResult(
        comparison[definition.key] - latestResult[definition.key],
        definition.format,
        currencySelect.value,
      ),
    ]);
    renderDynamicTable(
      scenarioTable,
      ["Metric", "Current", "Scenario B", "Difference"],
      rows,
    );
    scenarioTable.hidden = false;
  };

  const renderSensitivity = () => {
    if (!sensitivityTable || !primaryKey) return;
    const labels = Object.fromEntries(
      inputs.map((input) => [
        input.name,
        form.querySelector(`label[for='${CSS.escape(input.id)}']`)?.textContent ||
          input.name,
      ]),
    );
    const primaryFormat = resultDefinitions[0].format;
    const rows = buildSensitivity(formula, latestValues, primaryKey).map((row) => [
      labels[row.input],
      formatResult(row.low, primaryFormat, currencySelect.value),
      formatResult(row.base, primaryFormat, currencySelect.value),
      formatResult(row.high, primaryFormat, currencySelect.value),
    ]);
    renderDynamicTable(
      sensitivityTable,
      ["Input changed", "−10%", "Current", "+10%"],
      rows,
    );
  };

  const renderProjection = () => {
    if (!projectionCard || !projectionTable || !projectionSummary) return;
    const money = (value) =>
      formatResult(value, "currency", currencySelect.value);
    let headers = [];
    let rows = [];
    let summary = "";

    if (formula === "loan") {
      const base = buildLoanSchedule(latestValues, 0);
      const schedule = buildLoanSchedule(
        latestValues,
        Number(loanExtra?.value) || 0,
      );
      headers = ["Month", "Payment", "Principal", "Interest", "Balance"];
      rows = schedule.rows.map((row) => [
        row.month,
        money(row.payment),
        money(row.principal),
        money(row.interest),
        money(row.balance),
      ]);
      const monthsSaved = Math.max(0, base.payoffMonths - schedule.payoffMonths);
      const interestSaved = Math.max(
        0,
        base.totalInterest - schedule.totalInterest,
      );
      summary = `${schedule.payoffMonths} months to payoff · ${money(schedule.totalInterest)} total interest · ${monthsSaved} months and ${money(interestSaved)} saved`;
    } else if (formula === "compound_growth") {
      const projection = buildCompoundProjection(latestValues);
      headers = ["Year", "Starting", "Contributions", "Growth", "Ending"];
      rows = projection.map((row) => [
        row.year,
        money(row.startingBalance),
        money(row.contributions),
        money(row.growth),
        money(row.endingBalance),
      ]);
      summary = projection.length
        ? `${projection.length}-year growth projection ending at ${money(projection.at(-1).endingBalance)}`
        : "Enter a positive time period to generate a projection.";
    } else if (formula === "break_even") {
      const projection = buildBreakEvenProjection(latestValues);
      headers = ["Units", "Revenue", "Total cost", "Profit / loss"];
      rows = projection.map((row) => [
        row.units,
        money(row.revenue),
        money(row.totalCost),
        money(row.profit),
      ]);
      summary = projection.length
        ? "Compare profit and loss at several sales-volume levels."
        : "Selling price must be higher than variable cost.";
    } else if (formula === "cash_runway") {
      const projection = buildCashRunwayProjection(latestValues);
      headers = ["Month", "Opening cash", "Burn", "Ending cash"];
      rows = projection.map((row) => [
        row.month,
        money(row.opening),
        money(row.burn),
        money(row.ending),
      ]);
      summary = projection.length
        ? `${projection.length}-month cash balance projection.`
        : "Monthly burn must be greater than zero.";
    } else {
      projectionCard.hidden = true;
      return;
    }

    projectionCard.hidden = false;
    projectionSummary.textContent = summary;
    renderDynamicTable(projectionTable, headers, rows);
  };

  const updateAdvanced = () => {
    renderScenario();
    renderSensitivity();
    renderProjection();
  };

  const update = () => {
    const valid = inputs.every(validate);
    updateAffixes();
    if (!valid) return;
    latestValues = Object.fromEntries(
      inputs.map((input) => [input.name, Number(input.value)]),
    );
    latestResult = calculate(formula, latestValues);
    for (const output of resultElements) {
      output.textContent = formatResult(
        latestResult[output.dataset.result],
        output.dataset.format,
        currencySelect.value,
      );
    }
    try {
      localStorage.setItem(
        storageKey(slug),
        JSON.stringify({ ...latestValues, currency: currencySelect.value }),
      );
    } catch {}
    updateAdvanced();
  };

  const summary = () => {
    const lines = resultDefinitions.map((definition) => {
      const output = root.querySelector(
        `[data-result='${CSS.escape(definition.key)}']`,
      );
      return `${definition.label}: ${output?.textContent || "—"}`;
    });
    return `${document.querySelector("h1")?.textContent || "Calculation"}\n${lines.join("\n")}\n${location.href}`;
  };

  const exportCsv = () => {
    const records = [
      ["Section", "Metric", "Current", "Scenario B", "Difference"],
    ];
    const comparison = scenarioToggle?.checked
      ? calculate(formula, scenarioValues())
      : null;
    for (const definition of resultDefinitions) {
      records.push([
        "Results",
        definition.label,
        latestResult[definition.key],
        comparison?.[definition.key] ?? "",
        comparison
          ? comparison[definition.key] - latestResult[definition.key]
          : "",
      ]);
    }
    for (const row of buildSensitivity(formula, latestValues, primaryKey)) {
      records.push(["Sensitivity", row.input, row.base, row.low, row.high]);
    }
    const csv = records
      .map((record) => record.map(csvEscape).join(","))
      .join("\n");
    downloadText(csv, `${slug}-analysis.csv`);
    showToast("Analysis CSV downloaded.");
  };

  load();
  for (const scenarioInput of scenarioInputs) {
    const matching = inputs.find((input) => input.name === scenarioInput.name);
    scenarioInput.value = matching?.value ?? scenarioInput.value;
    scenarioInput.addEventListener("input", renderScenario);
  }
  scenarioToggle?.addEventListener("change", () => {
    if (scenarioToggle.checked) {
      for (const scenarioInput of scenarioInputs) {
        const matching = inputs.find((input) => input.name === scenarioInput.name);
        scenarioInput.value = matching?.value ?? scenarioInput.value;
      }
    }
    if (scenarioPanel) scenarioPanel.hidden = !scenarioToggle.checked;
    renderScenario();
  });
  loanExtra?.addEventListener("input", renderProjection);
  root.querySelector("[data-export-analysis]")?.addEventListener("click", exportCsv);

  update();
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  root.querySelector("[data-reset-calculator]")?.addEventListener("click", () => {
    for (const input of inputs) input.value = defaults[input.name];
    currencySelect.value = "USD";
    if (scenarioToggle) scenarioToggle.checked = false;
    if (scenarioPanel) scenarioPanel.hidden = true;
    if (scenarioTable) scenarioTable.hidden = true;
    if (loanExtra) loanExtra.value = "0";
    localStorage.removeItem(storageKey(slug));
    history.replaceState(null, "", location.pathname);
    update();
    showToast("Calculator reset.");
  });
  root.querySelector("[data-copy-results]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(summary());
      showToast("Results copied.");
    } catch {
      showToast("Could not access the clipboard.", "error");
    }
  });
  root
    .querySelector("[data-share-calculation]")
    ?.addEventListener("click", async () => {
      const params = new URLSearchParams({ currency: currencySelect.value });
      for (const input of inputs) params.set(input.name, input.value);
      const url = `${location.origin}${location.pathname}?${params}`;
      history.replaceState(null, "", url);
      try {
        if (navigator.share) {
          await navigator.share({ title: document.title, text: summary(), url });
        } else {
          await navigator.clipboard.writeText(url);
          showToast("Share link copied.");
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          showToast("Could not share this calculation.", "error");
        }
      }
    });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-calculator]");
  if (root) initCalculator(root);
}
