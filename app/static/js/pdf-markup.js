import { initCompare } from "./pdf-compare.js";
import { initStamp, initText } from "./pdf-edit.js";
import { bindSingleFile } from "./pdf-markup-runtime.js";
import { initSign } from "./pdf-sign.js";

export * from "./pdf-markup-core.js";

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-pdf-markup]");
  if (root) {
    bindSingleFile(root);
    if (root.dataset.pdfMarkup === "sign") initSign(root);
    if (root.dataset.pdfMarkup === "text") initText(root);
    if (root.dataset.pdfMarkup === "stamp") initStamp(root);
    if (root.dataset.pdfMarkup === "compare") initCompare(root);
  }
}
