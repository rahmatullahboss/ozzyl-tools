import { showToast } from "./app.js";
import { safeFilename } from "./data-tools-core.js";

const WORKER_SOURCE = `
self.onmessage = ({ data }) => {
  const started = performance.now();
  try {
    const regex = new RegExp(data.pattern, data.flags);
    const matches = [];
    if (regex.global) {
      let match;
      while ((match = regex.exec(data.text)) && matches.length < 500) {
        matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
        if (match[0] === "") regex.lastIndex += 1;
      }
    } else {
      const match = regex.exec(data.text);
      if (match) matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
    }
    const replacement = data.replacement ? data.text.replace(regex, data.replacement) : data.text;
    self.postMessage({ ok: true, matches, replacement, runtime: performance.now() - started });
  } catch (error) {
    self.postMessage({ ok: false, error: error.message, runtime: performance.now() - started });
  }
};`;

function setError(root, message = "") {
  const box = root.querySelector("[data-tool-error]");
  box.hidden = !message;
  box.textContent = message;
}

function downloadText(content, filename) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function runWorker(payload, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "application/javascript" }));
    const worker = new Worker(url);
    const timer = window.setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error("Pattern exceeded the one-second safety limit."));
    }, timeout);
    worker.onmessage = ({ data }) => {
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      if (data.ok) resolve(data);
      else reject(new Error(data.error));
    };
    worker.onerror = () => {
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error("Regex worker failed to complete."));
    };
    worker.postMessage(payload);
  });
}

function initRegex(root) {
  const pattern = root.querySelector("[data-regex-pattern]");
  const text = root.querySelector("[data-regex-text]");
  const replacement = root.querySelector("[data-regex-replacement]");
  const flags = [...root.querySelectorAll("[data-regex-flag]")];
  const matchList = root.querySelector("[data-regex-matches]");
  const output = root.querySelector("[data-regex-output]");
  let latestMatches = [];
  let requestId = 0;

  const renderMatches = () => {
    matchList.replaceChildren();
    if (!latestMatches.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No matches found.";
      matchList.append(empty);
      return;
    }
    latestMatches.forEach((match, index) => {
      const row = document.createElement("div");
      row.className = "regex-match";
      const value = document.createElement("div");
      value.textContent = `${index + 1}. ${match.value || "(empty match)"}`;
      const meta = document.createElement("small");
      const groups = match.groups.filter((group) => group !== undefined);
      meta.textContent = `Index ${match.index}${groups.length ? ` · Groups: ${groups.join(" | ")}` : ""}`;
      row.append(value, meta);
      matchList.append(row);
    });
  };

  const run = async () => {
    const current = ++requestId;
    setError(root);
    if (text.value.length > 200_000) {
      setError(root, "Keep regex test text below 200,000 characters.");
      return;
    }
    const selectedFlags = flags.filter((flag) => flag.checked).map((flag) => flag.value).join("");
    try {
      const result = await runWorker({
        pattern: pattern.value,
        flags: selectedFlags,
        text: text.value,
        replacement: replacement.value,
      });
      if (current !== requestId) return;
      latestMatches = result.matches;
      output.value = result.replacement;
      root.querySelector("[data-regex-count]").textContent = String(result.matches.length);
      root.querySelector("[data-regex-runtime]").textContent = `${result.runtime.toFixed(1)} ms`;
      renderMatches();
    } catch (error) {
      if (current !== requestId) return;
      latestMatches = [];
      output.value = "";
      root.querySelector("[data-regex-count]").textContent = "0";
      root.querySelector("[data-regex-runtime]").textContent = "—";
      renderMatches();
      setError(root, error.message);
    }
  };

  let timer;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 180);
  };
  [pattern, text, replacement, ...flags].forEach((field) => {
    field.addEventListener("input", schedule);
    field.addEventListener("change", schedule);
  });
  root.querySelector("[data-clear-input]").addEventListener("click", () => {
    pattern.value = "";
    text.value = "";
    replacement.value = "";
    schedule();
  });
  root.querySelector("[data-copy-regex]").addEventListener("click", async () => {
    const summary = latestMatches
      .map((match, index) => `${index + 1}. ${match.value} (index ${match.index})`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      showToast("Regex matches copied.");
    } catch {
      showToast("Could not access the clipboard.", "error");
    }
  });
  root.querySelector("[data-download-output]").addEventListener("click", () => {
    const report = `Pattern: /${pattern.value}/${flags.filter((flag) => flag.checked).map((flag) => flag.value).join("")}\n\nMatches:\n${latestMatches.map((match, index) => `${index + 1}. ${match.value} (index ${match.index})`).join("\n")}\n\nReplacement preview:\n${output.value}`;
    downloadText(report, `${safeFilename(pattern.value, "regex-test")}.txt`);
  });
  run();
}

if (typeof document !== "undefined") {
  const root = document.querySelector('[data-data-tool="regex"]');
  if (root) initRegex(root);
}
