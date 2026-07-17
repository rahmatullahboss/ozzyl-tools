import { showToast } from "./app.js";
import {
  buildBlankInsertionOrder,
  buildDuplicateOrder,
  cropBoxFromPercentages,
  outputFilename,
  parseKeywords,
  parsePageSelection,
} from "./pdf-lab-core.js";

export {
  buildBlankInsertionOrder,
  buildDuplicateOrder,
  cropBoxFromPercentages,
  outputFilename,
  parseKeywords,
  parsePageSelection,
} from "./pdf-lab-core.js";

const PDF_LIB_URL = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const A4_PORTRAIT = [595.28, 841.89];
const A4_LANDSCAPE = [841.89, 595.28];

let pdfLibPromise;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(bytes / 1024 ** index)} ${units[index]}`;
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

async function loadPdf(file, PDFDocument) {
  if (!file) throw new Error("Select a PDF file first.");
  if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
    throw new Error("Select a valid PDF file.");
  }
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than the recommended 50 MB limit.`);
  try {
    return await PDFDocument.load(await file.arrayBuffer());
  } catch {
    throw new Error(`${file.name} could not be opened. It may be protected, damaged, or unsupported.`);
  }
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
  const status = root.querySelector("[data-lab-status]");
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

function renderInspection(root, file, pdf) {
  const panel = root.querySelector("[data-file-inspection]");
  if (!panel) return;
  panel.hidden = false;
  panel.querySelector("[data-file-name]").textContent = file.name;
  panel.querySelector("[data-file-size]").textContent = formatBytes(file.size);
  panel.querySelector("[data-page-count]").textContent = `${pdf.getPageCount()} pages`;
  panel.querySelector("[data-document-title]").textContent = pdf.getTitle?.() || "No title metadata";
}

function bindDropzone(input) {
  const zone = input.closest("[data-dropzone]");
  if (!zone) return;
  for (const eventName of ["dragenter", "dragover"]) {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add("is-dragging");
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove("is-dragging");
    });
  }
  zone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function reportError(root, error) {
  const message = error instanceof Error ? error.message : "The PDF could not be processed.";
  setStatus(root, message, "error");
  showToast(message, "error");
}

async function inspectSelection(root, form, input) {
  const file = input.files[0];
  if (!file) {
    markReady(form, false);
    return null;
  }
  try {
    setStatus(root, "Inspecting the selected PDF…");
    const { PDFDocument } = await ensurePdfLib();
    const pdf = await loadPdf(file, PDFDocument);
    renderInspection(root, file, pdf);
    markReady(form, true);
    setStatus(root, `${pdf.getPageCount()}-page PDF ready for local processing.`, "ready");
    return pdf;
  } catch (error) {
    markReady(form, false);
    reportError(root, error);
    return null;
  }
}

function commonForm(root, name) {
  const form = root.querySelector(`[data-lab-form='${name}']`);
  const input = form.querySelector("[data-pdf-file]");
  bindDropzone(input);
  input.addEventListener("change", () => inspectSelection(root, form, input));
  return { form, input };
}

function initCrop(root) {
  const { form, input } = commonForm(root, "crop");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input.files[0];
    try {
      setBusy(form, true);
      setStatus(root, "Applying crop boxes to the selected pages…");
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await loadPdf(file, PDFDocument);
      const pages = parsePageSelection(form.querySelector("[data-pages]").value, pdf.getPageCount(), true);
      const margins = Object.fromEntries(["top", "right", "bottom", "left"].map((side) => [side, Number(form.querySelector(`[data-crop-${side}]`).value)]));
      for (const index of pages) {
        const page = pdf.getPage(index);
        const box = cropBoxFromPercentages(page.getWidth(), page.getHeight(), margins);
        page.setCropBox(box.x, box.y, box.width, box.height);
      }
      downloadPdf(await pdf.save(), outputFilename(file.name, "cropped"));
      setStatus(root, `Cropped ${pages.length} page${pages.length === 1 ? "" : "s"}.`, "success");
      showToast("Cropped PDF downloaded.");
    } catch (error) {
      reportError(root, error);
    } finally {
      setBusy(form, false);
    }
  });
}

function initDuplicate(root) {
  const { form, input } = commonForm(root, "duplicate");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input.files[0];
    try {
      setBusy(form, true);
      setStatus(root, "Copying selected pages into a new document…");
      const { PDFDocument } = await ensurePdfLib();
      const source = await loadPdf(file, PDFDocument);
      const selected = parsePageSelection(form.querySelector("[data-pages]").value, source.getPageCount());
      const order = buildDuplicateOrder(
        source.getPageCount(),
        selected,
        Number(form.querySelector("[data-copy-count]").value),
        form.querySelector("[data-copy-placement]").value,
      );
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, order);
      for (const page of pages) output.addPage(page);
      downloadPdf(await output.save(), outputFilename(file.name, "duplicated"));
      setStatus(root, `Created a ${output.getPageCount()}-page PDF with duplicated content.`, "success");
      showToast("Duplicated-page PDF downloaded.");
    } catch (error) {
      reportError(root, error);
    } finally {
      setBusy(form, false);
    }
  });
}

function blankPageSize(source, mode, anchorIndex) {
  if (mode === "a4-portrait") return A4_PORTRAIT;
  if (mode === "a4-landscape") return A4_LANDSCAPE;
  const page = source.getPage(anchorIndex);
  return [page.getWidth(), page.getHeight()];
}

function initBlank(root) {
  const { form, input } = commonForm(root, "blank");
  const position = form.querySelector("[data-blank-position]");
  const anchorGroup = form.querySelector("[data-anchor-group]");
  position.addEventListener("change", () => { anchorGroup.hidden = position.value === "end"; });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input.files[0];
    try {
      setBusy(form, true);
      setStatus(root, "Inserting blank pages into a new PDF…");
      const { PDFDocument } = await ensurePdfLib();
      const source = await loadPdf(file, PDFDocument);
      const anchor = Math.max(1, Math.min(source.getPageCount(), Number(form.querySelector("[data-anchor-page]").value) || source.getPageCount()));
      const count = Number(form.querySelector("[data-blank-count]").value);
      const order = buildBlankInsertionOrder(source.getPageCount(), count, position.value, anchor);
      const size = blankPageSize(source, form.querySelector("[data-blank-size]").value, anchor - 1);
      const output = await PDFDocument.create();
      for (const token of order) {
        if (token === null) output.addPage(size);
        else {
          const [page] = await output.copyPages(source, [token]);
          output.addPage(page);
        }
      }
      downloadPdf(await output.save(), outputFilename(file.name, "with-blank-pages"));
      setStatus(root, `Inserted ${Math.max(1, Math.round(count || 1))} blank page${count === 1 ? "" : "s"}.`, "success");
      showToast("PDF with blank pages downloaded.");
    } catch (error) {
      reportError(root, error);
    } finally {
      setBusy(form, false);
    }
  });
}

function initMetadata(root) {
  const { form, input } = commonForm(root, "metadata");
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await loadPdf(file, PDFDocument);
      form.querySelector("[data-meta-title]").value = pdf.getTitle?.() || "";
      form.querySelector("[data-meta-author]").value = pdf.getAuthor?.() || "";
      form.querySelector("[data-meta-subject]").value = pdf.getSubject?.() || "";
      const keywords = pdf.getKeywords?.();
      form.querySelector("[data-meta-keywords]").value = Array.isArray(keywords)
        ? keywords.join(", ")
        : String(keywords || "");
    } catch (error) {
      reportError(root, error);
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input.files[0];
    try {
      setBusy(form, true);
      setStatus(root, "Updating document metadata…");
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await loadPdf(file, PDFDocument);
      pdf.setTitle(form.querySelector("[data-meta-title]").value.trim());
      pdf.setAuthor(form.querySelector("[data-meta-author]").value.trim());
      pdf.setSubject(form.querySelector("[data-meta-subject]").value.trim());
      pdf.setKeywords(parseKeywords(form.querySelector("[data-meta-keywords]").value));
      pdf.setCreator("Ozzyl Tools PDF Metadata Editor");
      pdf.setProducer("Ozzyl Tools");
      downloadPdf(await pdf.save(), outputFilename(file.name, "metadata"));
      setStatus(root, "Updated PDF metadata and downloaded the new document.", "success");
      showToast("Metadata-updated PDF downloaded.");
    } catch (error) {
      reportError(root, error);
    } finally {
      setBusy(form, false);
    }
  });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-pdf-lab]");
  if (root?.dataset.pdfLab === "crop") initCrop(root);
  if (root?.dataset.pdfLab === "duplicate") initDuplicate(root);
  if (root?.dataset.pdfLab === "blank") initBlank(root);
  if (root?.dataset.pdfLab === "metadata") initMetadata(root);
}
