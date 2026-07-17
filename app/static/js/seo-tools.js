import { showToast } from "./app.js";
import {
  analyzeHeadingStructure,
  analyzeKeywordDensity,
  buildMetaTags,
  buildOpenGraphTags,
  buildRobotsTxt,
  buildSchemaMarkup,
  buildXmlSitemap,
  slugify,
  testRobotsPath,
} from "./seo-tools-core.js";

export * from "./seo-tools-core.js";

function setMessage(root, selector, message = "") {
  const box = root.querySelector(selector);
  if (!box) return;
  box.hidden = !message;
  box.textContent = message;
}
function setError(root, message = "") { setMessage(root, "[data-seo-error]", message); }
function setStatus(root, message = "") { setMessage(root, "[data-seo-status]", message); }
function downloadText(content, filename, type = "text/plain;charset=utf-8") { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1200); }
async function copyText(text, message = "Copied.") { try { await navigator.clipboard.writeText(text); showToast(message); } catch { showToast("Could not access the clipboard.", "error"); } }
function bindOutputActions(root, getOutput, filename, type) { root.querySelector("[data-copy-seo-output]")?.addEventListener("click", () => { const output = getOutput(); if (output) copyText(output, "Output copied."); }); root.querySelector("[data-download-seo-output]")?.addEventListener("click", () => { const output = getOutput(); if (output) downloadText(output, filename, type); }); }
function bindReset(root, render) { root.querySelector("[data-reset-seo]")?.addEventListener("click", () => { root.querySelector("form")?.reset(); render(); }); }

function initMeta(root) {
  const title = root.querySelector("[data-meta-title]"); const description = root.querySelector("[data-meta-description]"); const url = root.querySelector("[data-meta-url]"); const robots = root.querySelector("[data-meta-robots]"); const output = root.querySelector("[data-seo-output]"); let latest = "";
  const render = () => { setError(root); try { const result = buildMetaTags({ title: title.value, description: description.value, url: url.value, robots: robots.value }); latest = result.tags; output.value = latest; root.querySelector("[data-meta-preview-title]").textContent = result.title; root.querySelector("[data-meta-preview-url]").textContent = result.canonical; root.querySelector("[data-meta-preview-description]").textContent = result.description; root.querySelector("[data-meta-title-length]").textContent = String(result.titleLength); root.querySelector("[data-meta-description-length]").textContent = String(result.descriptionLength); const list = root.querySelector("[data-meta-warnings]"); list.replaceChildren(); for (const message of result.warnings.length ? result.warnings : ["Lengths are within common preview ranges."]) { const item = document.createElement("li"); item.textContent = message; list.append(item); } setStatus(root, result.warnings.length ? "Review the preview warnings before publishing." : "Meta tags are ready to copy."); } catch (error) { latest = ""; output.value = ""; setError(root, error.message); } };
  [title, description, url, robots].forEach((field) => { field.addEventListener("input", render); field.addEventListener("change", render); }); bindReset(root, render); bindOutputActions(root, () => latest, "meta-tags.html", "text/html;charset=utf-8"); render();
}

function initOpenGraph(root) {
  const fields = Object.fromEntries([...root.querySelectorAll("[data-og-field]")].map((field) => [field.dataset.ogField, field])); const output = root.querySelector("[data-seo-output]"); const image = root.querySelector("[data-og-preview-image]"); let latest = "";
  const render = () => { setError(root); try { const result = buildOpenGraphTags(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]))); latest = result.tags; output.value = latest; root.querySelector("[data-og-preview-site]").textContent = result.siteName || new URL(result.url).hostname; root.querySelector("[data-og-preview-title]").textContent = result.title; root.querySelector("[data-og-preview-description]").textContent = result.description; root.querySelector("[data-og-preview-card]").textContent = result.twitterCard; if (result.image) { image.src = result.image; image.hidden = false; } else { image.removeAttribute("src"); image.hidden = true; } setStatus(root, "Test the published URL in platform preview debuggers."); } catch (error) { latest = ""; output.value = ""; image.hidden = true; setError(root, error.message); } };
  Object.values(fields).forEach((field) => { field.addEventListener("input", render); field.addEventListener("change", render); }); bindReset(root, render); bindOutputActions(root, () => latest, "open-graph-tags.html", "text/html;charset=utf-8"); render();
}

function initRobots(root) {
  const form = root.querySelector("[data-robots-form]"); const output = root.querySelector("[data-seo-output]"); const testAgent = root.querySelector("[data-robots-test-agent]"); const testPath = root.querySelector("[data-robots-test-path]"); let latest = "";
  const testRule = () => { const box = root.querySelector("[data-robots-test-result]"); try { const result = testRobotsPath(latest, testAgent.value, testPath.value); box.dataset.allowed = String(result.allowed); box.textContent = result.allowed ? `Allowed${result.winner ? ` by ${result.winner.type}: ${result.winner.path}` : " because no blocking rule matched"}.` : `Blocked by Disallow: ${result.winner?.path || "matched rule"}.`; } catch (error) { box.textContent = error.message; } };
  const render = () => { setError(root); try { latest = buildRobotsTxt({ userAgent: form.querySelector("[data-robots-agent]").value, allow: form.querySelector("[data-robots-allow]").value, disallow: form.querySelector("[data-robots-disallow]").value, sitemap: form.querySelector("[data-robots-sitemap]").value }); output.value = latest; root.querySelector("[data-robots-lines]").textContent = String(latest.trim().split("\n").length); testRule(); setStatus(root, "Robots directives are crawl guidance, not access control."); } catch (error) { latest = ""; output.value = ""; setError(root, error.message); } };
  form.addEventListener("input", render); form.addEventListener("change", render); [testAgent, testPath].forEach((field) => field.addEventListener("input", testRule)); root.querySelector("[data-test-robots]")?.addEventListener("click", testRule); bindReset(root, render); bindOutputActions(root, () => latest, "robots.txt"); render();
}

function initSitemap(root) {
  const urls = root.querySelector("[data-sitemap-urls]"); const lastmod = root.querySelector("[data-sitemap-lastmod]"); const changefreq = root.querySelector("[data-sitemap-changefreq]"); const priority = root.querySelector("[data-sitemap-priority]"); const output = root.querySelector("[data-seo-output]"); let latest = "";
  const render = () => { setError(root); try { const result = buildXmlSitemap(urls.value, { lastmod: lastmod.value, changefreq: changefreq.value, priority: priority.value }); latest = result.xml; output.value = latest; root.querySelector("[data-sitemap-valid]").textContent = String(result.valid.length); root.querySelector("[data-sitemap-duplicates]").textContent = String(result.duplicates); root.querySelector("[data-sitemap-size]").textContent = `${new Blob([latest]).size.toLocaleString()} B`; setStatus(root, `Generated ${result.valid.length} unique URL${result.valid.length === 1 ? "" : "s"}.`); } catch (error) { latest = ""; output.value = ""; setError(root, error.message); } };
  root.querySelector("[data-generate-sitemap]")?.addEventListener("click", render); [lastmod, changefreq, priority].forEach((field) => field.addEventListener("change", render)); bindReset(root, render); bindOutputActions(root, () => latest, "sitemap.xml", "application/xml;charset=utf-8"); render();
}

function initSchema(root) {
  const type = root.querySelector("[data-schema-type]"); const output = root.querySelector("[data-seo-output]"); const fields = [...root.querySelectorAll("[data-schema-field]")]; let latest = "";
  const updateVisibility = () => { for (const wrapper of root.querySelectorAll("[data-schema-for]")) wrapper.hidden = !wrapper.dataset.schemaFor.split(",").includes(type.value); };
  const render = () => { updateVisibility(); setError(root); try { const result = buildSchemaMarkup(type.value, Object.fromEntries(fields.map((field) => [field.name, field.value]))); latest = result.script; output.value = latest; root.querySelector("[data-schema-root]").textContent = result.data["@type"]; root.querySelector("[data-schema-properties]").textContent = String(Object.keys(result.data).length); setStatus(root, "Keep structured data consistent with visible page content."); } catch (error) { latest = ""; output.value = ""; setError(root, error.message); } };
  type.addEventListener("change", render); fields.forEach((field) => field.addEventListener("input", render)); root.querySelector("[data-generate-schema]")?.addEventListener("click", render); bindReset(root, render); bindOutputActions(root, () => latest, "schema-markup.html", "text/html;charset=utf-8"); render();
}

function initSlug(root) {
  const input = root.querySelector("[data-slug-input]"); const separator = root.querySelector("[data-slug-separator]"); const lowercase = root.querySelector("[data-slug-lowercase]"); const unicode = root.querySelector("[data-slug-unicode]"); const output = root.querySelector("[data-slug-output]"); let latest = "";
  const render = () => { latest = slugify(input.value, { separator: separator.value, lowercase: lowercase.checked, preserveUnicode: unicode.checked }); output.textContent = latest || "Enter a title to generate a slug."; root.querySelector("[data-slug-length]").textContent = String(latest.length); root.querySelector("[data-slug-words]").textContent = String(latest ? latest.split(separator.value === "underscore" ? "_" : "-").length : 0); setStatus(root, latest ? "Slug generated locally." : ""); };
  [input, separator, lowercase, unicode].forEach((field) => { field.addEventListener("input", render); field.addEventListener("change", render); }); root.querySelector("[data-copy-slug]")?.addEventListener("click", () => { if (latest) copyText(latest, "Slug copied."); }); bindReset(root, render); render();
}

function initKeywordDensity(root) {
  const input = root.querySelector("[data-keyword-text]"); const minimum = root.querySelector("[data-keyword-minimum]"); const stopwords = root.querySelector("[data-keyword-stopwords]"); const table = root.querySelector("[data-keyword-table]"); let latestRows = [];
  const render = () => { setError(root); try { const result = analyzeKeywordDensity(input.value, { minimumLength: Number(minimum.value), ignoreStopwords: stopwords.checked }); latestRows = result.rows; for (const field of ["words", "uniqueWords", "sentences", "paragraphs", "readingMinutes"]) root.querySelector(`[data-keyword-stat="${field}"]`).textContent = String(result[field]); const body = table.querySelector("tbody"); body.replaceChildren(); for (const row of result.rows.slice(0, 50)) { const tr = document.createElement("tr"); [row.term, row.count, `${row.density.toFixed(2)}%`].forEach((value) => { const cell = document.createElement("td"); cell.textContent = String(value); tr.append(cell); }); body.append(tr); } setStatus(root, `Showing ${Math.min(50, result.rows.length)} of ${result.rows.length} terms.`); } catch (error) { setError(root, error.message); } };
  [input, minimum, stopwords].forEach((field) => { field.addEventListener("input", render); field.addEventListener("change", render); }); root.querySelector("[data-export-keywords]")?.addEventListener("click", () => { const csv = ["Keyword,Count,Density", ...latestRows.map((row) => `"${row.term.replaceAll('"', '""')}",${row.count},${row.density.toFixed(4)}`)].join("\n"); downloadText(csv, "keyword-density.csv", "text/csv;charset=utf-8"); }); bindReset(root, render); render();
}

function initHeadings(root) {
  const input = root.querySelector("[data-heading-html]"); const outline = root.querySelector("[data-heading-outline]"); const issues = root.querySelector("[data-heading-issues]"); let latestReport = "";
  const render = () => { setError(root); try { const result = analyzeHeadingStructure(input.value); root.querySelector("[data-heading-total]").textContent = String(result.headings.length); root.querySelector("[data-heading-h1]").textContent = String(result.h1Count); root.querySelector("[data-heading-depth]").textContent = String(result.maximumDepth); root.querySelector("[data-heading-issue-count]").textContent = String(result.issues.length); outline.replaceChildren(); for (const heading of result.headings) { const item = document.createElement("li"); item.style.setProperty("--heading-level", String(heading.level)); const badge = document.createElement("strong"); badge.textContent = `H${heading.level}`; const text = document.createElement("span"); text.textContent = heading.text; item.append(badge, text); outline.append(item); } issues.replaceChildren(); const messages = result.issues.length ? result.issues : ["No obvious heading-order issues were found."]; for (const message of messages) { const item = document.createElement("li"); item.textContent = message; issues.append(item); } latestReport = ["Heading outline", ...result.headings.map((heading) => `${"  ".repeat(heading.level - 1)}H${heading.level}: ${heading.text}`), "", "Issues", ...messages.map((message) => `- ${message}`)].join("\n"); setStatus(root, `${result.headings.length} headings inspected.`); } catch (error) { setError(root, error.message); } };
  input.addEventListener("input", render); root.querySelector("[data-copy-heading-report]")?.addEventListener("click", () => { if (latestReport) copyText(latestReport, "Heading report copied."); }); root.querySelector("[data-download-heading-report]")?.addEventListener("click", () => { if (latestReport) downloadText(latestReport, "heading-structure-report.txt"); }); bindReset(root, render); render();
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-seo-tool]");
  if (root) {
    const initializers = { meta: initMeta, open_graph: initOpenGraph, robots: initRobots, sitemap: initSitemap, schema: initSchema, slug: initSlug, keyword_density: initKeywordDensity, headings: initHeadings };
    initializers[root.dataset.seoTool]?.(root);
  }
}
