import { showToast } from "./app.js";
import {
  buildUtmUrl,
  dateToTimestamps,
  decodeBase64,
  delimitedToJson,
  describeRelativeDate,
  encodeBase64,
  formatJsonDocument,
  formatUuid,
  jsonToDelimited,
  minifyJsonDocument,
  timestampToDate,
  uuidFromBytes,
} from "./data-tools-core.js";

export * from "./data-tools-core.js";

function setError(root, message = "") {
  const box = root.querySelector("[data-tool-error]");
  if (!box) return;
  box.hidden = !message;
  box.textContent = message;
}

function setSuccess(root, message = "") {
  const box = root.querySelector("[data-tool-success]");
  if (!box) return;
  box.hidden = !message;
  box.textContent = message;
}

function downloadText(content, filename, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function copyText(text, successMessage = "Copied.") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    showToast("Could not access the clipboard.", "error");
  }
}

function initUtm(root) {
  const form = root.querySelector("[data-utm-form]");
  const fields = [...form.querySelectorAll("[data-utm-field]")];
  const style = form.querySelector("[data-utm-style]");
  const output = root.querySelector("[data-utm-output]");
  const parameterList = root.querySelector("[data-utm-parameters]");
  let latestUrl = "";

  const render = () => {
    setError(root);
    const baseUrl = form.querySelector('[data-utm-field="base_url"]').value;
    const values = Object.fromEntries(
      fields
        .filter((field) => field.dataset.utmField !== "base_url")
        .map((field) => [field.dataset.utmField, field.value]),
    );
    try {
      const result = buildUtmUrl(baseUrl, values, style.value);
      latestUrl = result.url;
      output.textContent = latestUrl;
      root.querySelector("[data-utm-length]").textContent = String(latestUrl.length);
      root.querySelector("[data-utm-count]").textContent = String(
        Object.keys(result.parameters).length,
      );
      parameterList.replaceChildren();
      for (const [key, value] of Object.entries(result.parameters)) {
        const row = document.createElement("div");
        const label = document.createElement("span");
        const code = document.createElement("code");
        label.textContent = key;
        code.textContent = value;
        row.append(label, code);
        parameterList.append(row);
      }
    } catch (error) {
      latestUrl = "";
      output.textContent = "Complete the required fields to generate a campaign URL.";
      root.querySelector("[data-utm-length]").textContent = "0";
      root.querySelector("[data-utm-count]").textContent = "0";
      parameterList.replaceChildren();
      setError(root, error.message);
    }
  };

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  root.querySelector("[data-copy-output]").addEventListener("click", () => {
    if (latestUrl) copyText(latestUrl, "Campaign URL copied.");
  });
  root.querySelector("[data-open-url]").addEventListener("click", () => {
    if (latestUrl) window.open(latestUrl, "_blank", "noopener,noreferrer");
  });
  root.querySelector("[data-download-output]").addEventListener("click", () => {
    if (latestUrl) downloadText(latestUrl, "utm-campaign-url.txt");
  });
  root.querySelector("[data-reset-tool]").addEventListener("click", () => {
    form.reset();
    render();
    showToast("UTM builder reset.");
  });
  render();
}

function initJson(root) {
  const input = root.querySelector("[data-json-input]");
  const output = root.querySelector("[data-json-output]");
  const indent = root.querySelector("[data-json-indent]");
  const sort = root.querySelector("[data-json-sort]");
  let latest = "";

  const applyStats = (result) => {
    for (const element of root.querySelectorAll("[data-json-stat]")) {
      element.textContent = String(result[element.dataset.jsonStat] ?? 0);
    }
  };

  const format = (mode = "format") => {
    setError(root);
    setSuccess(root);
    try {
      if (mode === "minify") {
        latest = minifyJsonDocument(input.value, sort.checked);
        output.value = latest;
        const stats = formatJsonDocument(latest, Number(indent.value), sort.checked);
        applyStats(stats);
        setSuccess(root, "Valid JSON. Minified successfully.");
      } else {
        const result = formatJsonDocument(input.value, Number(indent.value), sort.checked);
        latest = result.output;
        output.value = latest;
        applyStats(result);
        setSuccess(root, mode === "validate" ? "Valid JSON." : "Valid JSON. Formatted successfully.");
      }
    } catch (error) {
      latest = "";
      output.value = "";
      applyStats({ type: "—", depth: 0, keys: 0, values: 0 });
      setError(root, error.message);
    }
  };

  root.querySelector("[data-json-format]").addEventListener("click", () => format("format"));
  root.querySelector("[data-json-minify]").addEventListener("click", () => format("minify"));
  root.querySelector("[data-json-validate]").addEventListener("click", () => format("validate"));
  root.querySelector("[data-clear-input]").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    latest = "";
    setError(root);
    setSuccess(root);
  });
  root.querySelector("[data-copy-output]").addEventListener("click", () => {
    if (latest) copyText(latest, "JSON copied.");
  });
  root.querySelector("[data-download-output]").addEventListener("click", () => {
    if (latest) downloadText(latest, "formatted-data.json", "application/json;charset=utf-8");
  });
  format();
}

function initCsvJson(root) {
  const input = root.querySelector("[data-convert-input]");
  const output = root.querySelector("[data-convert-output]");
  const delimiter = root.querySelector("[data-delimiter]");
  const header = root.querySelector("[data-header-row]");
  const modes = [...root.querySelectorAll("[data-convert-mode]")];
  let latest = "";
  let latestExtension = "json";

  const currentMode = () => modes.find((mode) => mode.checked)?.value || "csv_to_json";
  const updateMode = () => {
    const csvToJson = currentMode() === "csv_to_json";
    root.querySelector("[data-convert-input-label]").textContent = csvToJson
      ? "CSV or delimited input"
      : "JSON array input";
    root.querySelector("[data-convert-output-title]").textContent = csvToJson
      ? "JSON result"
      : "CSV result";
    delimiter.querySelector('option[value="auto"]').disabled = !csvToJson;
    header.disabled = !csvToJson;
    if (!csvToJson && delimiter.value === "auto") delimiter.value = ",";
  };

  const convert = () => {
    setError(root);
    try {
      const mode = currentMode();
      const resolvedDelimiter = delimiter.value === "\\t" ? "\t" : delimiter.value;
      const result =
        mode === "csv_to_json"
          ? delimitedToJson(input.value, { delimiter: resolvedDelimiter, header: header.checked })
          : jsonToDelimited(input.value, resolvedDelimiter || ",");
      latest = result.output;
      latestExtension = mode === "csv_to_json" ? "json" : "csv";
      output.value = latest;
      root.querySelector("[data-convert-rows]").textContent = String(result.rows);
      root.querySelector("[data-convert-columns]").textContent = String(result.columns);
    } catch (error) {
      latest = "";
      output.value = "";
      root.querySelector("[data-convert-rows]").textContent = "0";
      root.querySelector("[data-convert-columns]").textContent = "0";
      setError(root, error.message);
    }
  };

  modes.forEach((mode) => mode.addEventListener("change", () => {
    updateMode();
    convert();
  }));
  delimiter.addEventListener("change", convert);
  header.addEventListener("change", convert);
  root.querySelector("[data-convert-run]").addEventListener("click", convert);
  root.querySelector("[data-clear-input]").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    latest = "";
    setError(root);
  });
  root.querySelector("[data-copy-output]").addEventListener("click", () => {
    if (latest) copyText(latest, "Converted data copied.");
  });
  root.querySelector("[data-download-output]").addEventListener("click", () => {
    if (!latest) return;
    const type = latestExtension === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8";
    downloadText(latest, `converted-data.${latestExtension}`, type);
  });
  updateMode();
  convert();
}

function initBase64(root) {
  const input = root.querySelector("[data-base64-input]");
  const output = root.querySelector("[data-base64-output]");
  const modes = [...root.querySelectorAll("[data-base64-mode]")];
  const urlSafe = root.querySelector("[data-base64-url-safe]");
  const noPadding = root.querySelector("[data-base64-no-padding]");
  let latest = "";

  const currentMode = () => modes.find((mode) => mode.checked)?.value || "encode";
  const updateMode = () => {
    const encoding = currentMode() === "encode";
    root.querySelector("[data-base64-input-label]").textContent = encoding
      ? "Plain Unicode text"
      : "Base64 text";
    root.querySelector("[data-base64-output-title]").textContent = encoding
      ? "Encoded Base64"
      : "Decoded text";
    noPadding.disabled = !encoding;
  };
  const convert = () => {
    setError(root);
    try {
      latest =
        currentMode() === "encode"
          ? encodeBase64(input.value, urlSafe.checked, noPadding.checked)
          : decodeBase64(input.value, urlSafe.checked);
      output.value = latest;
      root.querySelector("[data-base64-input-count]").textContent = String(input.value.length);
      root.querySelector("[data-base64-output-count]").textContent = String(latest.length);
    } catch (error) {
      latest = "";
      output.value = "";
      setError(root, error.message);
    }
  };

  modes.forEach((mode) => mode.addEventListener("change", () => {
    updateMode();
    convert();
  }));
  [urlSafe, noPadding].forEach((field) => field.addEventListener("change", convert));
  root.querySelector("[data-base64-run]").addEventListener("click", convert);
  root.querySelector("[data-clear-input]").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    latest = "";
    setError(root);
  });
  root.querySelector("[data-copy-output]").addEventListener("click", () => {
    if (latest) copyText(latest, "Base64 result copied.");
  });
  root.querySelector("[data-download-output]").addEventListener("click", () => {
    if (latest) downloadText(latest, "base64-result.txt");
  });
  updateMode();
  convert();
}

function initUuid(root) {
  const form = root.querySelector("[data-uuid-form]");
  const output = root.querySelector("[data-uuid-output]");
  let latest = "";

  const generate = () => {
    setError(root);
    const quantity = Math.min(100, Math.max(1, Number(root.querySelector("[data-uuid-quantity]").value) || 1));
    const separator = root.querySelector("[data-uuid-separator]").value;
    const options = {
      uppercase: root.querySelector("[data-uuid-uppercase]").checked,
      hyphens: !root.querySelector("[data-uuid-no-hyphens]").checked,
      braces: root.querySelector("[data-uuid-braces]").checked,
    };
    try {
      const values = Array.from({ length: quantity }, () => {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return formatUuid(uuidFromBytes(bytes), options);
      });
      latest = separator === "json" ? JSON.stringify(values, null, 2) : values.join(separator === "comma" ? ", " : "\n");
      output.value = latest;
      root.querySelector("[data-uuid-count]").textContent = String(values.length);
      root.querySelector("[data-uuid-unique]").textContent = String(new Set(values).size);
    } catch (error) {
      setError(root, error.message);
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generate();
  });
  form.addEventListener("change", generate);
  root.querySelector("[data-reset-tool]").addEventListener("click", () => {
    form.reset();
    generate();
  });
  root.querySelector("[data-copy-output]").addEventListener("click", () => {
    if (latest) copyText(latest, "UUIDs copied.");
  });
  root.querySelector("[data-download-output]").addEventListener("click", () => {
    if (latest) downloadText(latest, "generated-uuids.txt");
  });
  generate();
}

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initTimestamp(root) {
  const timestampInput = root.querySelector("[data-timestamp-input]");
  const unit = root.querySelector("[data-timestamp-unit]");
  const dateInput = root.querySelector("[data-date-input]");
  const outputs = Object.fromEntries(
    [...root.querySelectorAll("[data-time-result]")].map((element) => [
      element.dataset.timeResult,
      element,
    ]),
  );
  let latestDetails = "";

  const renderTimestamp = () => {
    setError(root);
    try {
      const date = timestampToDate(timestampInput.value, unit.value);
      const timestamps = dateToTimestamps(date);
      outputs.iso.textContent = date.toISOString();
      outputs.local.textContent = date.toLocaleString();
      outputs.relative.textContent = describeRelativeDate(date);
      outputs.seconds.textContent = String(timestamps.seconds);
      outputs.milliseconds.textContent = String(timestamps.milliseconds);
      latestDetails = `UTC: ${date.toISOString()}\nLocal: ${date.toLocaleString()}\nRelative: ${describeRelativeDate(date)}\nUnix seconds: ${timestamps.seconds}\nUnix milliseconds: ${timestamps.milliseconds}`;
    } catch (error) {
      setError(root, error.message);
    }
  };

  const renderDate = () => {
    setError(root);
    try {
      const timestamps = dateToTimestamps(dateInput.value);
      timestampInput.value = String(timestamps.seconds);
      unit.value = "seconds";
      renderTimestamp();
    } catch (error) {
      setError(root, error.message);
    }
  };

  timestampInput.addEventListener("input", renderTimestamp);
  unit.addEventListener("change", renderTimestamp);
  dateInput.addEventListener("input", renderDate);
  root.querySelector("[data-use-current-time]").addEventListener("click", () => {
    const now = new Date();
    dateInput.value = toLocalInputValue(now);
    timestampInput.value = String(Math.floor(now.getTime() / 1000));
    unit.value = "seconds";
    renderTimestamp();
  });
  root.querySelector("[data-copy-timestamp]").addEventListener("click", () => {
    if (latestDetails) copyText(latestDetails, "Timestamp details copied.");
  });
  dateInput.value = toLocalInputValue(timestampToDate(timestampInput.value, unit.value));
  renderTimestamp();
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-data-tool]");
  if (root) {
    const kind = root.dataset.dataTool;
    if (kind === "utm") initUtm(root);
    if (kind === "json") initJson(root);
    if (kind === "csv_json") initCsvJson(root);
    if (kind === "base64") initBase64(root);
    if (kind === "uuid") initUuid(root);
    if (kind === "timestamp") initTimestamp(root);
  }
}
