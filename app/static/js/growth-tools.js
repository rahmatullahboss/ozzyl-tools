import { showToast } from "./app.js";
import {
  applyGrowthStress,
  buildGrowthProjection,
  calculateGrowth,
  csvEscape,
} from "./growth-core.js";

export * from "./growth-core.js";

const finite = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

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
  const number = finite(value);
  const compact = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  if (format === "currency") return currencyFormatter(currency).format(number);
  if (format === "percent") return `${compact.format(number)}%`;
  if (format === "multiple") return `${compact.format(number)}×`;
  if (format === "months") return `${compact.format(number)} months`;
  if (format === "years") return `${compact.format(number)} years`;
  if (format === "days") return `${compact.format(number)} days`;
  if (format === "units") return `${compact.format(number)} units`;
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
  if (formula === "roi") {
    return {
      headers: ["Return scenario", "Return value", "Net profit", "ROI", "Annualized ROI"],
      rows: projection.map((row) => [
        row.period,
        money(row.returnValue),
        money(row.netProfit),
        `${row.roi.toFixed(2)}%`,
        `${row.annualized.toFixed(2)}%`,
      ]),
    };
  }
  if (formula === "roas") {
    return {
      headers: ["Revenue scenario", "Revenue", "ROAS", "Contribution", "Required revenue"],
      rows: projection.map((row) => [
        row.period,
        money(row.revenue),
        `${row.roas.toFixed(2)}×`,
        money(row.contribution),
        money(row.requiredRevenue),
      ]),
    };
  }
  if (formula === "clv") {
    return {
      headers: ["Period", "Cumulative revenue", "Gross contribution", "Net customer value"],
      rows: projection.map((row) => [
        row.period,
        money(row.cumulativeRevenue),
        money(row.grossProfit),
        money(row.netValue),
      ]),
    };
  }
  return {
    headers: ["Demand scenario", "Daily demand", "Reorder point", "Annual units", "Orders/year"],
    rows: projection.map((row) => [
      row.period,
      row.dailyDemand.toFixed(2),
      row.reorderPoint.toFixed(2),
      row.annualUnits.toFixed(2),
      row.annualOrders.toFixed(2),
    ]),
  };
}

function renderChart(container, projection, currency, formula) {
  container.replaceChildren();
  const values = projection.map((row) => finite(row.chartValue));
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
  svg.setAttribute("aria-label", "Business scenario chart");
  const axis = document.createElementNS(namespace, "line");
  const zeroY = height - padding - ((0 - minimum) / range) * (height - padding * 2);
  axis.setAttribute("x1", String(padding));
  axis.setAttribute("x2", String(width - padding));
  axis.setAttribute("y1", String(zeroY));
  axis.setAttribute("y2", String(zeroY));
  axis.setAttribute("class", "advanced-chart-axis");
  const line = document.createElementNS(namespace, "polyline");
  line.setAttribute("points", points.join(" "));
  line.setAttribute("class", "advanced-chart-line");
  svg.append(axis, line);
  for (const [index, point] of points.entries()) {
    const [x, y] = point.split(",");
    const circle = document.createElementNS(namespace, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("class", "advanced-chart-point");
    const title = document.createElementNS(namespace, "title");
    const label = formula === "roi"
      ? `${values[index].toFixed(2)}%`
      : formula === "reorder_point"
        ? `${values[index].toFixed(2)} units`
        : currencyFormatter(currency).format(values[index]);
    title.textContent = `${projection[index].period}: ${label}`;
    circle.append(title);
    svg.append(circle);
  }
  container.append(svg);
}

function initGrowthCalculator(root) {
  const form = root.querySelector("[data-growth-form]");
  const currency = root.querySelector("[data-growth-currency]");
  const formula = root.dataset.formula;
  const slug = root.dataset.slug;
  const sensitivityKey = root.dataset.sensitivityKey;
  const fields = [...form.querySelectorAll("[data-growth-input]")];
  const outputs = [...root.querySelectorAll("[data-growth-result]")];
  const stress = root.querySelector("[data-growth-stress]");
  const table = root.querySelector("[data-growth-projection]");
  const chart = root.querySelector("[data-growth-chart]");
  const errorBox = root.querySelector("[data-growth-error]");
  const storageKey = `ozzyl-growth:${slug}`;
  const defaults = Object.fromEntries(fields.map((field) => [field.name, field.value]));
  let latestResult = {};
  let latestProjection = [];

  const updateAffixes = () => {
    const symbol = currencyFormatter(currency.value)
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value || currency.value;
    const affixes = {
      money: symbol,
      percent: "%",
      years: "yrs",
      months: "mos",
      days: "days",
      units: "units",
    };
    for (const field of fields) {
      const affix = field.parentElement.querySelector("[data-field-affix]");
      if (affix) affix.textContent = affixes[field.dataset.inputKind] || "";
    }
  };

  const validate = () => {
    let valid = true;
    for (const field of fields) {
      const value = Number(field.value);
      let message = "";
      if (!Number.isFinite(value)) message = "Enter a valid number.";
      else if (field.min !== "" && value < Number(field.min)) {
        message = `Minimum value is ${field.min}.`;
      } else if (field.max !== "" && value > Number(field.max)) {
        message = `Maximum value is ${field.max}.`;
      }
      field.setAttribute("aria-invalid", String(Boolean(message)));
      const error = form.querySelector(`[data-error-for='${CSS.escape(field.name)}']`);
      if (error) error.textContent = message;
      if (message) valid = false;
    }
    return valid;
  };

  const readValues = () => Object.fromEntries(
    fields.map((field) => [field.name, Number(field.value)]),
  );

  const render = () => {
    updateAffixes();
    errorBox.hidden = true;
    if (!validate()) return;
    const values = readValues();
    try {
      latestResult = calculateGrowth(formula, values);
      latestProjection = buildGrowthProjection(formula, values);
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      return;
    }
    for (const output of outputs) {
      output.textContent = formatResult(
        latestResult[output.dataset.growthResult],
        output.dataset.format,
        currency.value,
      );
    }
    const change = Number(stress.value) || 0;
    root.querySelector("[data-growth-stress-value]").textContent = `${change > 0 ? "+" : ""}${change}%`;
    const stressed = calculateGrowth(formula, applyGrowthStress(values, sensitivityKey, change));
    const primary = outputs[0];
    root.querySelector("[data-growth-stress-result]").textContent = `${formatResult(
      stressed[primary.dataset.growthResult],
      primary.dataset.format,
      currency.value,
    )} (${formatResult(
      stressed[primary.dataset.growthResult] - latestResult[primary.dataset.growthResult],
      primary.dataset.format,
      currency.value,
    )} change)`;
    const money = (value) => formatResult(value, "currency", currency.value);
    const presentation = projectionPresentation(formula, latestProjection, money);
    renderTable(table, presentation.headers, presentation.rows);
    renderChart(chart, latestProjection, currency.value, formula);
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        values: Object.fromEntries(fields.map((field) => [field.name, field.value])),
        currency: currency.value,
        stress: stress.value,
      }));
    } catch {}
  };

  const load = () => {
    const params = new URLSearchParams(location.search);
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      saved = {};
    }
    for (const field of fields) {
      field.value = params.get(field.name) ?? saved.values?.[field.name] ?? field.value;
    }
    currency.value = params.get("currency") ?? saved.currency ?? currency.value;
    stress.value = params.get("stress") ?? saved.stress ?? stress.value;
  };

  const summary = () => `${document.querySelector("h1")?.textContent || "Business calculation"}\n${outputs
    .map((output) => `${output.closest("div")?.querySelector("span")?.textContent || output.dataset.growthResult}: ${output.textContent}`)
    .join("\n")}\n${location.href}`;

  const exportCsv = () => {
    const records = [["Section", "Metric", "Value"]];
    for (const output of outputs) {
      records.push([
        "Results",
        output.closest("div")?.querySelector("span")?.textContent || output.dataset.growthResult,
        latestResult[output.dataset.growthResult],
      ]);
    }
    const presentation = projectionPresentation(formula, latestProjection, (value) => value);
    records.push([], ["Projection", ...presentation.headers]);
    for (const row of presentation.rows) records.push(["", ...row]);
    downloadText(
      records.map((row) => row.map(csvEscape).join(",")).join("\n"),
      `${slug}-report.csv`,
    );
    showToast("Business analysis CSV downloaded.");
  };

  load();
  render();
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  stress.addEventListener("input", render);
  currency.addEventListener("change", render);
  root.querySelector("[data-export-growth]")?.addEventListener("click", exportCsv);
  root.querySelector("[data-print-growth]")?.addEventListener("click", () => window.print());
  root.querySelector("[data-copy-growth]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(summary());
      showToast("Results copied.");
    } catch {
      showToast("Could not access the clipboard.", "error");
    }
  });
  root.querySelector("[data-share-growth]")?.addEventListener("click", async () => {
    const params = new URLSearchParams({ currency: currency.value, stress: stress.value });
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
  root.querySelector("[data-reset-growth]")?.addEventListener("click", () => {
    for (const field of fields) field.value = defaults[field.name];
    currency.value = "USD";
    stress.value = "0";
    localStorage.removeItem(storageKey);
    history.replaceState(null, "", location.pathname);
    render();
    showToast("Calculator reset.");
  });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-growth-calculator]");
  if (root) initGrowthCalculator(root);
}
