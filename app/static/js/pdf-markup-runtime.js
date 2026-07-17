import { textItemsToLines } from "./pdf-markup-core.js";

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
let pdfJsPromise;
let pdfLibPromise;

function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(window[globalName]);
    script.onerror = () => reject(new Error("Could not load the PDF processing engine."));
    document.head.append(script);
  });
}

export function ensurePdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = loadScript(
      "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js",
      "pdfjsLib",
    ).then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      return pdfjsLib;
    });
  }
  return pdfJsPromise;
}

export function ensurePdfLib() {
  if (!pdfLibPromise) {
    pdfLibPromise = loadScript(
      "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
      "PDFLib",
    );
  }
  return pdfLibPromise;
}

export function validateFile(file) {
  if (!file) throw new Error("Select a PDF file first.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Use a PDF smaller than 50 MB.");
  if (!/\.pdf$/iu.test(file.name) && file.type !== "application/pdf") {
    throw new Error("Select a valid PDF file.");
  }
}

export function safeBaseName(filename) {
  return String(filename || "document")
    .replace(/\.pdf$/iu, "")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "document";
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function setStatus(root, message, type = "working") {
  const status = root.querySelector("[data-markup-status]");
  status.hidden = false;
  status.dataset.state = type;
  status.textContent = message;
}

export function setBusy(form, busy) {
  const button = form.querySelector("[data-process-button]");
  if (button) button.disabled = busy;
  form.setAttribute("aria-busy", String(busy));
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadBytes(bytes, filename, type = "application/pdf") {
  downloadBlob(new Blob([bytes], { type }), filename);
}

export function dataUrlToBytes(dataUrl) {
  const [, encoded] = String(dataUrl).split(",", 2);
  if (!encoded) throw new Error("Could not prepare the image.");
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function openPdfJs(file) {
  validateFile(file);
  const pdfjsLib = await ensurePdfJs();
  return pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

export async function inspectSingleFile(root, file) {
  const pdf = await openPdfJs(file);
  const card = root.querySelector("[data-file-inspection]");
  card.hidden = false;
  card.querySelector("[data-file-name]").textContent = file.name;
  card.querySelector("[data-file-size]").textContent = formatBytes(file.size);
  card.querySelector("[data-page-count]").textContent = String(pdf.numPages);
  root.dataset.pageCount = String(pdf.numPages);
  return pdf;
}

export function bindSingleFile(root) {
  const input = root.querySelector("[data-pdf-file]");
  if (!input) return;
  input.addEventListener("change", async () => {
    try {
      setBusy(input.form, true);
      const pdf = await inspectSingleFile(root, input.files[0]);
      setStatus(root, `${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"} ready.`, "ready");
    } catch (error) {
      setStatus(root, error.message, "error");
    } finally {
      setBusy(input.form, false);
    }
  });
}

export async function extractPdfLines(file) {
  const pdf = await openPdfJs(file);
  const lines = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const pageLines = textItemsToLines((await page.getTextContent()).items);
    lines.push(...pageLines.map((line) => `[Page ${pageNumber}] ${line}`));
  }
  return { lines, pageCount: pdf.numPages };
}
