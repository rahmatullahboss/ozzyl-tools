import { hexToRgb, parsePageSelection, placementFromPercent, stampPlacement } from "./pdf-markup-core.js";
import {
  downloadBytes,
  ensurePdfLib,
  safeBaseName,
  setBusy,
  setStatus,
  validateFile,
} from "./pdf-markup-runtime.js";

export function initText(root) {
  const form = root.querySelector('[data-markup-form="text"]');
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = form.querySelector("[data-pdf-file]").files[0];
    try {
      validateFile(file);
      setBusy(form, true);
      setStatus(root, "Adding text to the PDF…");
      const text = form.querySelector("[data-text-value]").value.trim();
      if (!text) throw new Error("Enter the text to add.");
      const { PDFDocument, StandardFonts, rgb } = await ensurePdfLib();
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pageNumber = Number(form.querySelector("[data-page-number]").value);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pdf.getPageCount()) {
        throw new Error(`Choose a page from 1 to ${pdf.getPageCount()}.`);
      }
      const page = pdf.getPage(pageNumber - 1);
      const { width, height } = page.getSize();
      const size = Number(form.querySelector("[data-font-size]").value) || 14;
      const color = hexToRgb(form.querySelector("[data-text-color]").value);
      const placement = placementFromPercent({
        pageWidth: width,
        pageHeight: height,
        xPercent: form.querySelector("[data-x-percent]").value,
        yPercent: form.querySelector("[data-y-percent]").value,
        widthPercent: 90,
        itemHeight: size,
      });
      page.drawText(text, {
        x: placement.x,
        y: placement.y,
        size,
        font: await pdf.embedFont(StandardFonts.Helvetica),
        color: rgb(color.r, color.g, color.b),
        maxWidth: Math.max(20, width - placement.x - 24),
        lineHeight: size * 1.25,
      });
      downloadBytes(await pdf.save(), `${safeBaseName(file.name)}-text-added.pdf`);
      setStatus(root, "Text added and PDF downloaded.", "success");
    } catch (error) {
      setStatus(root, error.message, "error");
    } finally {
      setBusy(form, false);
    }
  });
}

export function initStamp(root) {
  const form = root.querySelector('[data-markup-form="stamp"]');
  const preset = form.querySelector("[data-stamp-preset]");
  const custom = form.querySelector("[data-custom-stamp]");
  const updateCustom = () => {
    custom.closest(".field-group").hidden = preset.value !== "custom";
  };
  preset.addEventListener("change", updateCustom);
  updateCustom();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = form.querySelector("[data-pdf-file]").files[0];
    try {
      validateFile(file);
      setBusy(form, true);
      setStatus(root, "Applying the PDF stamp…");
      const text = preset.value === "custom" ? custom.value.trim() : preset.value;
      if (!text) throw new Error("Enter custom stamp text.");
      const { PDFDocument, StandardFonts, degrees, rgb } = await ensurePdfLib();
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pages = parsePageSelection(form.querySelector("[data-pages]").value, pdf.getPageCount());
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const size = Number(form.querySelector("[data-stamp-size]").value) || 42;
      const opacity = Math.min(
        1,
        Math.max(0.05, Number(form.querySelector("[data-stamp-opacity]").value) || 0.35),
      );
      const rotation = Number(form.querySelector("[data-stamp-rotation]").value) || 0;
      const color = hexToRgb(form.querySelector("[data-stamp-color]").value);
      const textWidth = font.widthOfTextAtSize(text, size);
      for (const pageIndex of pages) {
        const page = pdf.getPage(pageIndex);
        const { width, height } = page.getSize();
        const placement = stampPlacement(
          width,
          height,
          textWidth,
          size,
          form.querySelector("[data-stamp-position]").value,
          36,
        );
        page.drawText(text, {
          ...placement,
          size,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: degrees(rotation),
        });
      }
      downloadBytes(await pdf.save(), `${safeBaseName(file.name)}-stamped.pdf`);
      setStatus(
        root,
        `Stamp added to ${pages.length} page${pages.length === 1 ? "" : "s"}.`,
        "success",
      );
    } catch (error) {
      setStatus(root, error.message, "error");
    } finally {
      setBusy(form, false);
    }
  });
}
