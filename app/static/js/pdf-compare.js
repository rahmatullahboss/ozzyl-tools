import { showToast } from "./app.js";
import { compareLines, summarizeDiff } from "./pdf-markup-core.js";
import {
  downloadBlob,
  extractPdfLines,
  setBusy,
  setStatus,
  validateFile,
} from "./pdf-markup-runtime.js";

export function initCompare(root) {
  const form = root.querySelector('[data-markup-form="compare"]');
  const output = root.querySelector("[data-diff-output]");
  const actions = root.querySelector("[data-diff-actions]");
  let diffText = "";
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const original = form.querySelector("[data-original-file]").files[0];
    const revised = form.querySelector("[data-revised-file]").files[0];
    try {
      validateFile(original);
      validateFile(revised);
      setBusy(form, true);
      setStatus(root, "Extracting and comparing selectable text…");
      const [left, right] = await Promise.all([
        extractPdfLines(original),
        extractPdfLines(revised),
      ]);
      if (!left.lines.length && !right.lines.length) {
        throw new Error("No selectable text was found. Scanned PDFs require OCR before comparison.");
      }
      const changes = compareLines(left.lines, right.lines);
      const summary = summarizeDiff(changes);
      root.querySelector("[data-added-count]").textContent = String(summary.added);
      root.querySelector("[data-removed-count]").textContent = String(summary.removed);
      root.querySelector("[data-unchanged-count]").textContent = String(summary.unchanged);
      root.querySelector("[data-comparison-summary]").hidden = false;
      output.replaceChildren();
      const visible = changes.filter((change) => change.type !== "same");
      for (const change of visible) {
        const line = document.createElement("div");
        line.className = `pdf-diff-line pdf-diff-${change.type}`;
        line.textContent = `${change.type === "add" ? "+" : "−"} ${change.text}`;
        output.append(line);
      }
      if (!visible.length) {
        const message = document.createElement("p");
        message.textContent = "No selectable-text differences were found.";
        output.append(message);
      }
      diffText = [
        `Original: ${original.name} (${left.pageCount} pages)`,
        `Revised: ${revised.name} (${right.pageCount} pages)`,
        `Added lines: ${summary.added}`,
        `Removed lines: ${summary.removed}`,
        `Unchanged lines: ${summary.unchanged}`,
        "",
        ...visible.map((change) => `${change.type === "add" ? "+" : "-"} ${change.text}`),
      ].join("\n");
      actions.hidden = false;
      const truncationNote = left.lines.length > 800 || right.lines.length > 800
        ? " Comparison was limited to the first 800 extracted lines per document."
        : "";
      setStatus(
        root,
        `Compared ${left.pageCount} and ${right.pageCount} page versions.${truncationNote}`,
        "success",
      );
    } catch (error) {
      setStatus(root, error.message, "error");
    } finally {
      setBusy(form, false);
    }
  });
  root.querySelector("[data-copy-diff]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(diffText);
      showToast("PDF comparison copied.");
    } catch {
      showToast("Could not access the clipboard.", "error");
    }
  });
  root.querySelector("[data-download-diff]").addEventListener("click", () => {
    downloadBlob(
      new Blob([diffText], { type: "text/plain;charset=utf-8" }),
      "pdf-text-comparison.txt",
    );
  });
}
