import { placementFromPercent } from "./pdf-markup-core.js";
import {
  dataUrlToBytes,
  downloadBytes,
  ensurePdfLib,
  safeBaseName,
  setBusy,
  setStatus,
  validateFile,
} from "./pdf-markup-runtime.js";

function prepareSignatureCanvas(canvas) {
  const context = canvas.getContext("2d");
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 5;
  context.strokeStyle = "#111827";
  let drawing = false;
  let changed = false;
  const point = (event) => {
    const box = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - box.left) * (canvas.width / box.width),
      y: (event.clientY - box.top) * (canvas.height / box.height),
    };
  };
  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    changed = true;
    canvas.setPointerCapture(event.pointerId);
    const current = point(event);
    context.beginPath();
    context.moveTo(current.x, current.y);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const current = point(event);
    context.lineTo(current.x, current.y);
    context.stroke();
  });
  const stop = () => {
    drawing = false;
    context.closePath();
  };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  return {
    clear() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      changed = false;
    },
    hasDrawing: () => changed,
  };
}

function typedSignature(name) {
  const text = String(name || "").trim();
  if (!text) throw new Error("Enter the signer name.");
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 260;
  const context = canvas.getContext("2d");
  context.font = "italic 108px cursive";
  context.fillStyle = "#111827";
  context.textBaseline = "middle";
  context.fillText(text, 30, canvas.height / 2, canvas.width - 60);
  return canvas.toDataURL("image/png");
}

async function imageFileDataUrl(file) {
  if (!file) throw new Error("Choose a signature image.");
  if (!file.type.startsWith("image/")) throw new Error("Choose a PNG or JPEG image.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the signature image."));
    reader.readAsDataURL(file);
  });
}

export function initSign(root) {
  const form = root.querySelector('[data-markup-form="sign"]');
  const canvas = form.querySelector("[data-signature-canvas]");
  const drawing = prepareSignatureCanvas(canvas);
  const mode = form.querySelector("[data-signature-mode]");
  const panels = [...form.querySelectorAll("[data-signature-panel]")];
  const updateMode = () => {
    for (const panel of panels) panel.hidden = panel.dataset.signaturePanel !== mode.value;
  };
  mode.addEventListener("change", updateMode);
  updateMode();
  form.querySelector("[data-clear-signature]").addEventListener("click", drawing.clear);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = form.querySelector("[data-pdf-file]").files[0];
    try {
      validateFile(file);
      setBusy(form, true);
      setStatus(root, "Adding the signature…");
      let dataUrl;
      if (mode.value === "typed") {
        dataUrl = typedSignature(form.querySelector("[data-signer-name]").value);
      } else if (mode.value === "drawn") {
        if (!drawing.hasDrawing()) throw new Error("Draw a signature before continuing.");
        dataUrl = canvas.toDataURL("image/png");
      } else {
        dataUrl = await imageFileDataUrl(form.querySelector("[data-signature-file]").files[0]);
      }
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pageNumber = Number(form.querySelector("[data-page-number]").value);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pdf.getPageCount()) {
        throw new Error(`Choose a page from 1 to ${pdf.getPageCount()}.`);
      }
      const bytes = dataUrlToBytes(dataUrl);
      const image = dataUrl.startsWith("data:image/jpeg")
        ? await pdf.embedJpg(bytes)
        : await pdf.embedPng(bytes);
      const page = pdf.getPage(pageNumber - 1);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const widthPercent = Number(form.querySelector("[data-signature-width]").value) || 25;
      const targetWidth = pageWidth * widthPercent / 100;
      const targetHeight = targetWidth * image.height / image.width;
      const placement = placementFromPercent({
        pageWidth,
        pageHeight,
        xPercent: form.querySelector("[data-x-percent]").value,
        yPercent: form.querySelector("[data-y-percent]").value,
        widthPercent,
        itemHeight: targetHeight,
      });
      page.drawImage(image, { ...placement, height: targetHeight });
      downloadBytes(await pdf.save(), `${safeBaseName(file.name)}-signed.pdf`);
      setStatus(root, "Signature added and PDF downloaded.", "success");
    } catch (error) {
      setStatus(root, error.message, "error");
    } finally {
      setBusy(form, false);
    }
  });
}
