import { showToast } from "./app.js";
import {
  applyStress,
  buildProjection,
  calculateAdvanced,
  csvEscape,
  parseCashFlows,
} from "./advanced-calculator-core.js";

const finite = (value) => (Number.isFinite(value) ? value : 0);

export {
  advancedCalculators,
  applyStress,
  buildCagrProjection,
  buildNpvProjection,
  buildPricingProjection,
  buildProjection,
  buildSavingsProjection,
  calculateAdvanced,
  calculateCagr,
  calculateNpv,
  calculateNpvIrr,
  calculateSavingsGoal,
  calculateTargetMargin,
  csvEscape,
  estimateIrr,
  parseCashFlows,
  simplePayback,
} from "./advanced-calculator-core.js";

function currencyFormatter(currency) {
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
  const number = finite(Number(value));
  const compact = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  if (format === "currency") return currencyFormatter(currency).format(number);
  if (format === "percent") return `${compact.format(number)}%`;
  if (format === "multiple") return `${compact.format(number)}×`;
  if (format === "years") return `${compact.format(number)} years`;
  return compact.format(number);
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderTable(table, headers, rows) {
  const head = table.querySelector("thead");
  const body = table.querySelector("tbody");
  head.replaceChildren();
  body.replaceChildren();
  const headerRow = document.createElement("tr");
  for (const header of headers) {
    const cell = document.createElement("th");
    cell.textContent = header;
    headerRow.append(cell);
  }
  head.append(headerRow);
  for (const values of rows) {
    const row = document.createElement("tr");
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  }
}

function projectionPresentation(formula, projection, money) {
  if (formula === "savings_goal") {
    return {
      headers: ["Period", "Starting", "Saved", "Growth", "Ending"],
      rows: projection.map((row) => [row.period, money(row.starting), money(row.contribution), money(row.growth), money(row.ending)]),
    };
  }
  if (formula === "cagr") {
    return {
      headers: ["Period", "Implied value", "Growth from start"],
      rows: projection.map((row) => [row.period, money(row.value), money(row.growth)]),
    };
  }
  if (formula === "npv") {
    return {
      headers: ["Period", "Cash flow", "Discount factor", "Present value", "Cumulative NPV"],
      rows: projection.map((row) => [
        row.period,
        money(row.cashFlow),
        row.discountFactor.toFixed(4),
        money(row.presentValue),
        money(row.cumulative),
      ]),
    };
  }
  return {
    headers: ["Scenario", "List price", "Sale price", "Customer price", "Profit"],
    rows: projection.map((row) => [row.period, money(row.listPrice), money(row.salePrice), money(row.customerPrice), money(row.profit)]),
  };
}

function renderChart(container, projection, currency) {
  container.replaceChildren();
  const values = projection.map((row) => Number(row.chartValue) || 0);
  if (!values.length) return;
  const width = 720;
  const height = 240;
  const padding = 28;
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(1, ...values);
  const range = Math.max(1, maximum - minimum);
  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - minimum) / range) * (height - padding * 2);
    return `${x},${y}`;
  });
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Projection chart");
  const zeroY = height - padding - ((0 - minimum) / range) * (height - padding * 2);
  const axis = document.createElementNS(namespace, "line");
  axis.setAttribute("x1", String(padding));
  axis.setAttribute("x2", String(width - padding));
  axis.setAttribute("y1", String(zeroY));
  axis.setAttribute("y2", String(zeroY));
  axis.setAttribute("class", "advanced-chart-axis");
  const polyline = document.createElementNS(namespace, "polyline");
  polyline.setAttribute("points", points.join(" "));
  polyline.setAttribute("class", "advanced-chart-line");
  svg.append(axis, polyline);
  for (const [index, point] of points.entries()) {
    const [x, y] = point.split(",");
    const circle = document.createElementNS(namespace, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("class", "advanced-chart-point");
    const title = document.createElementNS(namespace, "title");
    title.textContent = `${projection[index].period}: ${currencyFormatter(currency).format(values[index])}`;
    circle.append(title);
    svg.append(circle);
  }
  container.append(svg);
}

function initAdvancedCalculator(root) {
  const form = root.querySelector("[data-advanced-form]");
  const currency = root.querySelector("[data-advanced-currency]");
  const formula = root.dataset.formula;
  const slug = root.dataset.slug;
  const sensitivityKey = root.dataset.sensitivityKey;
  const fields = [...form.querySelectorAll("[data-advanced-input]")];
  const outputs = [...root.querySelectorAll("[data-advanced-result]")];
  const stress = root.querySelector("[data-stress]");
  const stressLabel = root.querySelector("[data-stress-value]");
  const stressResult = root.querySelector("[data-stress-result]");
  const projectionTable = root.querySelector("[data-advanced-projection]");
  const chart = root.querySelector("[data-advanced-chart]");
  const storageKey = `ozzyl-advanced:${slug}`;
  const defaults = Object.fromEntries(fields.map((field) => [field.name, field.value]));
  let latestValues = {};
  let latestResult = {};
  let latestProjection = [];

  const readValues = () => Object.fromEntries(fields.map((field) => [
    field.name,
    field.dataset.inputKind === "series" ? parseCashFlows(field.value) : Number(field.value),
  ]));

  const updateAffixes = () => {
    const symbol = currencyFormatter(currency.value)
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value || currency.value;
    for (const field of fields) {
      const affix = field.parentElement.querySelector("[data-field-affix]");
      if (!affix) continue;
      const map = { money: symbol, percent: "%", years: "yrs" };
      affix.textContent = map[field.dataset.inputKind] || "";
    }
  };

  const validate = () => {
    let valid = true;
    for (const field of fields) {
      const error = form.querySelector(`[data-error-for='${CSS.escape(field.name)}']`);
      let message = "";
      try {
        if (field.dataset.inputKind === "series") parseCashFlows(field.value);
        else {
          const value = Number(field.value);
          if (!Number.isFinite(value)) message = "Enter a valid number.";
          else if (field.min !== "" && value < Number(field.min)) message = `Minimum value is ${field.min}.`;
          else if (field.max !== "" && value > Number(field.max)) message = `Maximum value is ${field.max}.`;
        }
      } catch (problem) {
        message = problem.message;
      }
      field.setAttribute("aria-invalid", String(Boolean(message)));
      if (error) error.textContent = message;
      if (message) valid = false;
    }
    return valid;
  };

  const render = () => {
    updateAffixes();
    if (!validate()) return;
    latestValues = readValues();
    latestResult = calculateAdvanced(formula, latestValues);
    latestProjection = buildProjection(formula, latestValues);
    for (const output of outputs) {
      output.textContent = formatResult(
        latestResult[output.dataset.advancedResult],
        output.dataset.format,
        currency.value,
      );
    }
    const stressChange = Number(stress?.value) || 0;
    if (stressLabel) stressLabel.textContent = `${stressChange > 0 ? "+" : ""}${stressChange}%`;
    if (stressResult) {
      const stressedValues = applyStress(latestValues, sensitivityKey, stressChange);
      const stressed = calculateAdvanced(formula, stressedValues);
      const primary = outputs[0];
      const key = primary.dataset.advancedResult;
      stressResult.textContent = `${formatResult(stressed[key], primary.dataset.format, currency.value)} (${formatResult(stressed[key] - latestResult[key], primary.dataset.format, currency.value)} change)`;
    }
    const money = (value) => formatResult(value, "currency", currency.value);
    const presentation = projectionPresentation(formula, latestProjection, money);
    renderTable(projectionTable, presentation.headers, presentation.rows);
    renderChart(chart, latestProjection, currency.value);
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        values: Object.fromEntries(fields.map((field) => [field.name, field.value])),
        currency: currency.value,
        stress: stress?.value || "0",
      }));
    } catch {}
  };

  const load = () => {
    const params = new URLSearchParams(location.search);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { saved = {}; }
    for (const field of fields) {
      field.value = params.get(field.name) ?? saved.values?.[field.name] ?? field.value;
    }
    currency.value = params.get("currency") ?? saved.currency ?? currency.value;
    if (stress) stress.value = params.get("stress") ?? saved.stress ?? stress.value;
  };

  const summary = () => {
    const lines = outputs.map((output) => {
      const label = output.closest("div")?.querySelector("span")?.textContent || output.dataset.advancedResult;
      return `${label}: ${output.textContent}`;
    });
    return `${document.querySelector("h1")?.textContent || "Advanced calculation"}\n${lines.join("\n")}\n${location.href}`;
  };

  const exportCsv = () => {
    const records = [["Section", "Metric", "Value"]];
    for (const output of outputs) {
      const label = output.closest("div")?.querySelector("span")?.textContent || output.dataset.advancedResult;
      records.push(["Results", label, latestResult[output.dataset.advancedResult]]);
    }
    const presentation = projectionPresentation(formula, latestProjection, (value) => value);
    records.push([], ["Projection", ...presentation.headers]);
    for (const row of presentation.rows) records.push(["", ...row]);
    downloadText(records.map((row) => row.map(csvEscape).join(",")).join("\n"), `${slug}-report.csv`);
    showToast("Advanced report CSV downloaded.");
  };

  load();
  render();
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  stress?.addEventListener("input", render);
  currency.addEventListener("change", render);
  root.querySelector("[data-export-report]")?.addEventListener("click", exportCsv);
  root.querySelector("[data-print-report]")?.addEventListener("click", () => window.print());
  root.querySelector("[data-copy-report]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(summary());
      showToast("Results copied.");
    } catch {
      showToast("Could not access the clipboard.", "error");
    }
  });
  root.querySelector("[data-share-report]")?.addEventListener("click", async () => {
    const params = new URLSearchParams({ currency: currency.value, stress: stress?.value || "0" });
    for (const field of fields) params.set(field.name, field.value);
    const url = `${location.origin}${location.pathname}?${params}`;
    history.replaceState(null, "", url);
    try {
      if (navigator.share) await navigator.share({ title: document.title, text: summary(), url });
      else {
        await navigator.clipboard.writeText(url);
        showToast("Share link copied.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Could not share this report.", "error");
    }
  });
  root.querySelector("[data-reset-advanced]")?.addEventListener("click", () => {
    for (const field of fields) field.value = defaults[field.name];
    currency.value = "USD";
    if (stress) stress.value = "0";
    localStorage.removeItem(storageKey);
    history.replaceState(null, "", location.pathname);
    render();
    showToast("Calculator reset.");
  });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-advanced-calculator]");
  if (root) initAdvancedCalculator(root);
}
