import { showToast } from "./app.js";

const PDF_LIB_URL = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;
const A4_PORTRAIT = [595.28, 841.89];
const A4_LANDSCAPE = [841.89, 595.28];
const AUTO_MAX_DIMENSION = 1440;

let pdfLibPromise;

export function parsePageSelection(value, pageCount, defaultAll = false) {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new RangeError("The PDF must contain at least one page.");
  }

  const input = String(value ?? "").trim();
  if (!input) {
    if (defaultAll) return Array.from({ length: pageCount }, (_, index) => index);
    throw new Error("Enter at least one page number or range.");
  }

  const pages = [];
  const seen = new Set();
  for (const token of input.split(",")) {
    const match = token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error(`Invalid page selection: ${token.trim() || "empty value"}.`);

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      throw new RangeError(`Pages must be between 1 and ${pageCount}.`);
    }
    if (start > end) throw new RangeError(`Page range ${start}-${end} is reversed.`);

    for (let page = start; page <= end; page += 1) {
      const index = page - 1;
      if (!seen.has(index)) {
        seen.add(index);
        pages.push(index);
      }
    }
  }

  return pages;
}

export function normalizeRotation(currentAngle, delta) {
  const current = Number(currentAngle) || 0;
  const change = Number(delta) || 0;
  return ((current + change) % 360 + 360) % 360;
}

export function fitImageToPage(imageWidth, imageHeight, pageWidth, pageHeight, margin = 0) {
  const width = Number(imageWidth);
  const height = Number(imageHeight);
  const targetWidth = Number(pageWidth);
  const targetHeight = Number(pageHeight);
  const safeMargin = Math.max(0, Number(margin) || 0);

  if (![width, height, targetWidth, targetHeight].every((value) => value > 0)) {
    throw new RangeError("Image and page dimensions must be positive.");
  }

  const availableWidth = Math.max(1, targetWidth - safeMargin * 2);
  const availableHeight = Math.max(1, targetHeight - safeMargin * 2);
  const scale = Math.min(availableWidth / width, availableHeight / height);
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;

  return {
    width: renderedWidth,
    height: renderedHeight,
    x: (targetWidth - renderedWidth) / 2,
    y: (targetHeight - renderedHeight) / 2,
  };
}

export function outputFilename(filename, suffix) {
  const base = String(filename || "document.pdf").replace(/\.pdf$/iu, "") || "document";
  return `${base}-${suffix}.pdf`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(bytes / 1024 ** index)} ${units[index]}`;
}

function isPdf(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImage(file) {
  return ["image/jpeg", "image/png"].includes(file.type) || /\.(jpe?g|png)$/iu.test(file.name);
}

function validateFiles(files, { minimum = 1, type = "pdf" } = {}) {
  if (files.length < minimum) {
    throw new Error(minimum === 2 ? "Select at least two PDF files." : "Select a file first.");
  }

  const validator = type === "image" ? isImage : isPdf;
  const invalid = files.find((file) => !validator(file));
  if (invalid) throw new Error(`${invalid.name} is not a supported ${type === "image" ? "JPG or PNG image" : "PDF"}.`);

  const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
  if (oversized) throw new Error(`${oversized.name} is larger than the recommended 50 MB limit.`);

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_BYTES) throw new Error("The selected files exceed the combined 120 MB limit.");
}

function ensurePdfLib() {
  if (globalThis.PDFLib) return Promise.resolve(globalThis.PDFLib);
  if (pdfLibPromise) return pdfLibPromise;
  if (typeof document === "undefined") return Promise.reject(new Error("PDF processing requires a browser."));

  pdfLibPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PDF_LIB_URL;
    script.async = true;
    script.referrerPolicy = "no-referrer";
    const nonce = document.querySelector("script[nonce]")?.nonce;
    if (nonce) script.nonce = nonce;
    script.addEventListener("load", () => {
      if (globalThis.PDFLib) resolve(globalThis.PDFLib);
      else reject(new Error("The PDF engine did not initialize."));
    });
    script.addEventListener("error", () => reject(new Error("Could not load the PDF engine. Check your connection and try again.")));
    document.head.append(script);
  });

  return pdfLibPromise;
}

function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function setStatus(root, message, state = "working") {
  const status = root.querySelector("[data-pdf-status]");
  if (!status) return;
  status.hidden = false;
  status.dataset.state = state;
  status.textContent = message;
}

function setBusy(form, busy) {
  const button = form.querySelector("[data-process-button]");
  if (!button) return;
  button.disabled = busy || button.dataset.ready !== "true";
  button.classList.toggle("is-loading", busy);
  button.setAttribute("aria-busy", String(busy));
}

function markReady(form, ready) {
  const button = form.querySelector("[data-process-button]");
  if (!button) return;
  button.dataset.ready = String(ready);
  button.disabled = !ready;
}

function renderFileList(root, files) {
  const list = root.querySelector("[data-file-list]");
  if (!list) return;
  list.replaceChildren();
  for (const [index, file] of files.entries()) {
    const row = document.createElement("div");
    row.className = "pdf-file-row";
    const details = document.createElement("span");
    const name = document.createElement("strong");
    const size = document.createElement("small");
    const order = document.createElement("b");
    order.textContent = String(index + 1);
    name.textContent = file.name;
    size.textContent = formatBytes(file.size);
    details.append(name, size);
    row.append(order, details);
    list.append(row);
  }
  list.hidden = files.length === 0;
}

function bindDropzone(input) {
  const dropzone = input.closest("[data-dropzone]");
  if (!dropzone) return;
  for (const eventName of ["dragenter", "dragover"]) {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
    });
  }
  dropzone.addEventListener("drop", (event) => {
    if (!event.dataTransfer?.files.length) return;
    const transfer = new DataTransfer();
    const incoming = [...event.dataTransfer.files];
    for (const file of input.multiple ? incoming : incoming.slice(0, 1)) transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function reportError(root, error) {
  const message = error instanceof Error ? error.message : "The PDF could not be processed.";
  setStatus(root, message, "error");
  showToast(message, "error");
}

async function loadPdf(file, PDFDocument) {
  try {
    return await PDFDocument.load(await file.arrayBuffer());
  } catch {
    throw new Error(`${file.name} could not be opened. It may be protected, damaged, or unsupported.`);
  }
}

function initMerge(root) {
  const form = root.querySelector('[data-pdf-form="merge"]');
  const input = form.querySelector("[data-pdf-files]");
  bindDropzone(input);
  input.addEventListener("change", () => {
    const files = [...input.files];
    renderFileList(root, files);
    markReady(form, files.length >= 2);
    setStatus(root, files.length >= 2 ? `${files.length} files ready to merge.` : "Select at least two PDFs.", files.length >= 2 ? "ready" : "working");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = [...input.files];
    try {
      validateFiles(files, { minimum: 2 });
      setBusy(form, true);
      setStatus(root, "Loading PDF engine and combining pages…");
      const { PDFDocument } = await ensurePdfLib();
      const output = await PDFDocument.create();
      for (const file of files) {
        const source = await loadPdf(file, PDFDocument);
        const pages = await output.copyPages(source, source.getPageIndices());
        for (const page of pages) output.addPage(page);
      }
      const bytes = await output.save();
      downloadPdf(bytes, "merged.pdf");
      setStatus(root, `Merged ${files.length} files into a ${output.getPageCount()}-page PDF.`, "success");
      showToast("Merged PDF downloaded.");
    } catch (error) {
      reportError(root, error);
    } finally {
      setBusy(form, false);
    }
  });
}

function initSplit(root) {
  const form = root.querySelector('[data-pdf-form="split"]');
  const input = form.querySelector("[data-pdf-file]");
  const selection = form.querySelector("[data-page-selection]");
  bindDropzone(input);
  input.addEventListener("change", () => {
    const files = [...input.files];
    renderFileList(root, files);
    markReady(form, files.length === 1);
    setStatus(root, files.length ? "PDF selected. Enter the pages you want to extract." : "Select one PDF.", files.length ? "ready" : "working");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input.files[0];
    try {
      validateFiles(file ? [file] : []);
      setBusy(form, true);
      setStatus(root, "Reading the PDF and extracting selected pages…");
      const { PDFDocument } = await ensurePdfLib();
      const source = await loadPdf(file, PDFDocument);
      const pages = parsePageSelection(selection.value, source.getPageCount());
      const output = await PDFDocument.create();
      const copiedPages = await output.copyPages(source, pages);
      for (const page of copiedPages) output.addPage(page);
      const bytes = await output.save();
      downloadPdf(bytes, outputFilename(file.name, "pages"));
      setStatus(root, `Created a new PDF with ${pages.length} selected page${pages.length === 1 ? "" : "s"}.`, "success");
      showToast("Extracted PDF downloaded.");
    } catch (error) {
      reportError(root, error);
    } finally {
      setBusy(form, false);
    }
  });
}

function initRotate(root) {
  const form = root.querySelector('[data-pdf-form="rotate"]');
  const input = form.querySelector("[data-pdf-file]");
  const selection = form.querySelector("[data-page-selection]");
  const rotation = form.querySelector("[data-rotation]");
  bindDropzone(input);
  input.addEventListener("change", () => {
    const files = [...input.files];
    renderFileList(root, files);
    markReady(form, files.length === 1);
    setStatus(root, files.length ? "PDF selected and ready to rotate." : "Select one PDF.", files.length ? "ready" : "working");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input.files[0];
    try {
      validateFiles(file ? [file] : []);
      setBusy(form, true);
      setStatus(root, "Applying page rotations…");
      const { PDFDocument, degrees } = await ensurePdfLib();
      const pdf = await loadPdf(file, PDFDocument);
      const pages = parsePageSelection(selection.value, pdf.getPageCount(), true);
      const delta = Number(rotation.value);
      for (const index of pages) {
        const page = pdf.getPage(index);
        page.setRotation(degrees(normalizeRotation(page.getRotation().angle, delta)));
      }
      const bytes = await pdf.save();
      downloadPdf(bytes, outputFilename(file.name, "rotated"));
      setStatus(root, `Rotated ${pages.length} page${pages.length === 1 ? "" : "s"}.`, "success");
      showToast("Rotated PDF downloaded.");
    } catch (error) {
      reportError(root, error);
    } finally {
      setBusy(form, false);
    }
  });
}

function resolvePageSize(image, mode, margin) {
  if (mode === "a4-portrait") return A4_PORTRAIT;
  if (mode === "a4-landscape") return A4_LANDSCAPE;
  const scale = Math.min(1, AUTO_MAX_DIMENSION / Math.max(image.width, image.height));
  return [image.width * scale + margin * 2, image.height * scale + margin * 2];
}

function initImages(root) {
  const form = root.querySelector('[data-pdf-form="images"]');
  const input = form.querySelector("[data-image-files]");
  const pageSize = form.querySelector("[data-page-size]");
  const pageMargin = form.querySelector("[data-page-margin]");
  bindDropzone(input);
  input.addEventListener("change", () => {
    const files = [...input.files];
    renderFileList(root, files);
    markReady(form, files.length >= 1);
    setStatus(root, files.length ? `${files.length} image${files.length === 1 ? "" : "s"} ready.` : "Select JPG or PNG images.", files.length ? "ready" : "working");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = [...input.files];
    try {
      validateFiles(files, { type: "image" });
      setBusy(form, true);
      setStatus(root, "Building PDF pages from your images…");
      const { PDFDocument } = await ensurePdfLib();
      const output = await PDFDocument.create();
      const margin = Number(pageMargin.value);

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const image = /png$/iu.test(file.name) || file.type === "image/png" ? await output.embedPng(bytes) : await output.embedJpg(bytes);
        const [width, height] = resolvePageSize(image, pageSize.value, margin);
        const page = output.addPage([width, height]);
        const placement = fitImageToPage(image.width, image.height, width, height, margin);
        page.drawImage(image, placement);
      }

      const bytes = await output.save();
      downloadPdf(bytes, "images.pdf");
      setStatus(root, `Created a ${files.length}-page PDF from your images.`, "success");
      showToast("Image PDF downloaded.");
    } catch (error) {
      reportError(root, error);
    } finally {
      setBusy(form, false);
    }
  });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-pdf-tool]");
  if (root?.dataset.pdfTool === "merge") initMerge(root);
  if (root?.dataset.pdfTool === "split") initSplit(root);
  if (root?.dataset.pdfTool === "rotate") initRotate(root);
  if (root?.dataset.pdfTool === "images") initImages(root);
}
