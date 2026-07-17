import { showToast } from "./app.js";
import { assertTextLimit, safeFilename } from "./data-tools-core.js";

let qrPromise;

function ensureQrEngine() {
  if (window.QRCode) return Promise.resolve(window.QRCode);
  if (!qrPromise) {
    qrPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/qrcode@1.5.4/build/qrcode.js";
      script.async = true;
      script.onload = () => (window.QRCode ? resolve(window.QRCode) : reject(new Error("QR engine did not initialize.")));
      script.onerror = () => reject(new Error("Could not load the QR generation engine."));
      document.head.append(script);
    });
  }
  return qrPromise;
}

function setError(root, message = "") {
  const box = root.querySelector("[data-tool-error]");
  box.hidden = !message;
  box.textContent = message;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function initQr(root) {
  const form = root.querySelector("[data-qr-form]");
  const canvas = root.querySelector("[data-qr-canvas]");
  const content = root.querySelector("[data-qr-content]");
  const size = root.querySelector("[data-qr-size]");
  const level = root.querySelector("[data-qr-level]");
  const margin = root.querySelector("[data-qr-margin]");
  const dark = root.querySelector("[data-qr-dark]");
  const light = root.querySelector("[data-qr-light]");
  let latestOptions = {};
  let rendering = false;
  let queued = false;

  const options = () => ({
    width: Math.min(1024, Math.max(160, Number(size.value) || 512)),
    margin: Math.min(12, Math.max(0, Number(margin.value) || 0)),
    errorCorrectionLevel: level.value,
    color: { dark: dark.value, light: light.value },
  });

  const render = async () => {
    if (rendering) {
      queued = true;
      return;
    }
    rendering = true;
    setError(root);
    try {
      const text = content.value.trim();
      assertTextLimit(text, 4000);
      if (!text) throw new Error("Enter a URL or text to encode.");
      const QRCode = await ensureQrEngine();
      latestOptions = options();
      await QRCode.toCanvas(canvas, text, latestOptions);
      root.querySelector("[data-qr-characters]").textContent = String(text.length);
      root.querySelector("[data-qr-output-size]").textContent = `${latestOptions.width} px`;
    } catch (error) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      setError(root, error.message);
    } finally {
      rendering = false;
      if (queued) {
        queued = false;
        render();
      }
    }
  };

  let timer;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(render, 120);
  };
  form.addEventListener("input", schedule);
  form.addEventListener("change", schedule);

  root.querySelector("[data-download-png]").addEventListener("click", () => {
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${safeFilename(content.value, "qr-code")}.png`);
    }, "image/png");
  });
  root.querySelector("[data-download-svg]").addEventListener("click", async () => {
    try {
      const QRCode = await ensureQrEngine();
      const svg = await QRCode.toString(content.value.trim(), { ...latestOptions, type: "svg" });
      downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${safeFilename(content.value, "qr-code")}.svg`);
    } catch (error) {
      setError(root, error.message);
    }
  });
  root.querySelector("[data-copy-qr-text]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(content.value);
      showToast("QR content copied.");
    } catch {
      showToast("Could not access the clipboard.", "error");
    }
  });
  root.querySelector("[data-reset-tool]").addEventListener("click", () => {
    form.reset();
    render();
    showToast("QR options reset.");
  });
  await render();
}

if (typeof document !== "undefined") {
  const root = document.querySelector('[data-data-tool="qr"]');
  if (root) initQr(root);
}
