const MAX_TEXT_LENGTH = 2_000_000;
function assertLength(value, limit = MAX_TEXT_LENGTH) { if (String(value ?? "").length > limit) throw new Error(`Keep input below ${limit.toLocaleString()} characters.`); }
function absoluteHttpUrl(value, label = "URL") { let url; try { url = new URL(String(value ?? "").trim()); } catch { throw new Error(`${label} must be a complete http:// or https:// URL.`); } if (!/^https?:$/u.test(url.protocol)) throw new Error(`${label} must use http:// or https://.`); return url.toString(); }
export function xmlEscape(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;"); }

export function parseRobotsTxt(text) {
  assertLength(text, 200_000);
  const groups = []; let current = null; const sitemaps = [];
  for (const rawLine of String(text).split(/\r?\n/u)) {
    const line = rawLine.replace(/#.*$/u, "").trim(); if (!line || !line.includes(":")) continue;
    const separator = line.indexOf(":"); const key = line.slice(0, separator).trim().toLowerCase(); const value = line.slice(separator + 1).trim();
    if (key === "user-agent") { if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current); } current.agents.push(value.toLowerCase()); }
    else if ((key === "allow" || key === "disallow") && current) current.rules.push({ type: key, path: value });
    else if (key === "sitemap" && value) sitemaps.push(value);
  }
  return { groups, sitemaps };
}

function matchingGroups(groups, userAgent) { const agent = String(userAgent || "*").toLowerCase(); const exact = groups.filter((group) => group.agents.some((value) => value !== "*" && agent.includes(value))); return exact.length ? exact : groups.filter((group) => group.agents.includes("*")); }
export function testRobotsPath(text, userAgent, path) { const parsed = parseRobotsTxt(text); const cleanPath = String(path || "/").startsWith("/") ? String(path || "/") : `/${path}`; const rules = matchingGroups(parsed.groups, userAgent).flatMap((group) => group.rules); const matching = rules.filter((rule) => rule.path && cleanPath.startsWith(rule.path.replace(/\*.*$/u, ""))).sort((left, right) => right.path.length - left.path.length || (left.type === "allow" ? -1 : 1)); const winner = matching[0] || null; return { allowed: !winner || winner.type === "allow", winner, rules, parsed }; }
export function buildRobotsTxt({ userAgent = "*", allow = "/", disallow = "", sitemap = "" }) { const allowPaths = String(allow ?? "").split(/\r?\n/u).map((value) => value.trim()).filter(Boolean); const disallowPaths = String(disallow ?? "").split(/\r?\n/u).map((value) => value.trim()).filter(Boolean); const lines = [`User-agent: ${String(userAgent || "*").trim()}`]; allowPaths.forEach((path) => lines.push(`Allow: ${path.startsWith("/") ? path : `/${path}`}`)); disallowPaths.forEach((path) => lines.push(`Disallow: ${path.startsWith("/") ? path : `/${path}`}`)); if (!allowPaths.length && !disallowPaths.length) lines.push("Allow: /"); if (String(sitemap).trim()) lines.push("", `Sitemap: ${absoluteHttpUrl(sitemap, "Sitemap URL")}`); return lines.join("\n") + "\n"; }

export function normalizeSitemapUrls(text, limit = 10_000) {
  assertLength(text); const lines = String(text).split(/\r?\n/u).map((value) => value.trim()).filter(Boolean); if (lines.length > limit) throw new Error(`Use no more than ${limit.toLocaleString()} URLs in one browser session.`);
  const valid = []; const invalid = []; const seen = new Set(); let duplicates = 0;
  for (const line of lines) { try { const url = absoluteHttpUrl(line, "Sitemap URL"); if (seen.has(url)) duplicates += 1; else { seen.add(url); valid.push(url); } } catch { invalid.push(line); } }
  return { valid, invalid, duplicates, submitted: lines.length };
}
export function buildXmlSitemap(text, options = {}) { const normalized = normalizeSitemapUrls(text); if (!normalized.valid.length) throw new Error("Enter at least one valid absolute URL."); if (normalized.invalid.length) throw new Error(`Fix ${normalized.invalid.length} invalid URL${normalized.invalid.length === 1 ? "" : "s"} before generating the sitemap.`); const lastmod = String(options.lastmod ?? "").trim(); const changefreq = String(options.changefreq ?? "").trim(); const priority = String(options.priority ?? "").trim(); if (lastmod && !/^\d{4}-\d{2}-\d{2}$/u.test(lastmod)) throw new Error("Last modified date must use YYYY-MM-DD."); if (priority && (!Number.isFinite(Number(priority)) || Number(priority) < 0 || Number(priority) > 1)) throw new Error("Priority must be between 0.0 and 1.0."); const entries = normalized.valid.map((url) => { const fields = [`    <loc>${xmlEscape(url)}</loc>`]; if (lastmod) fields.push(`    <lastmod>${lastmod}</lastmod>`); if (changefreq) fields.push(`    <changefreq>${xmlEscape(changefreq)}</changefreq>`); if (priority) fields.push(`    <priority>${Number(priority).toFixed(1)}</priority>`); return `  <url>\n${fields.join("\n")}\n  </url>`; }); const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`; return { xml, ...normalized }; }
