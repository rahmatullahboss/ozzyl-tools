function absoluteHttpUrl(value, label = "URL", optional = false) {
  const text = String(value ?? "").trim();
  if (!text && optional) return "";
  let url;
  try { url = new URL(text); } catch { throw new Error(`${label} must be a complete http:// or https:// URL.`); }
  if (!/^https?:$/u.test(url.protocol)) throw new Error(`${label} must use http:// or https://.`);
  return url.toString();
}

export function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function buildMetaTags({ title, description, url, robots = "index,follow" }) {
  const cleanTitle = String(title ?? "").trim();
  const cleanDescription = String(description ?? "").trim();
  if (!cleanTitle) throw new Error("Enter a page title.");
  if (!cleanDescription) throw new Error("Enter a meta description.");
  const canonical = absoluteHttpUrl(url, "Canonical URL");
  const warnings = [];
  if (cleanTitle.length < 30) warnings.push("The title is short; make the page purpose more specific.");
  if (cleanTitle.length > 60) warnings.push("The title may be truncated in search results.");
  if (cleanDescription.length < 70) warnings.push("The description is short; explain the page benefit more clearly.");
  if (cleanDescription.length > 160) warnings.push("The description may be truncated in search results.");
  const tags = [
    `<title>${escapeHtml(cleanTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(cleanDescription)}">`,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta name="robots" content="${escapeHtml(robots)}">`,
  ].join("\n");
  return { tags, title: cleanTitle, description: cleanDescription, canonical, titleLength: cleanTitle.length, descriptionLength: cleanDescription.length, warnings };
}

export function buildOpenGraphTags(values) {
  const title = String(values.title ?? "").trim();
  const description = String(values.description ?? "").trim();
  if (!title || !description) throw new Error("Title and description are required.");
  const url = absoluteHttpUrl(values.url, "Page URL");
  const image = absoluteHttpUrl(values.image, "Image URL", true);
  const siteName = String(values.siteName ?? "").trim();
  const type = String(values.type || "website").trim();
  const twitterCard = image ? "summary_large_image" : "summary";
  const pairs = [["og:type", type], ["og:title", title], ["og:description", description], ["og:url", url], ["og:site_name", siteName], ["og:image", image]].filter(([, value]) => value);
  const tags = [
    ...pairs.map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}">`),
    `<meta name="twitter:card" content="${twitterCard}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    ...(image ? [`<meta name="twitter:image" content="${escapeHtml(image)}">`] : []),
  ].join("\n");
  return { tags, title, description, url, image, siteName, type, twitterCard };
}

function compactObject(value) {
  if (Array.isArray(value)) return value.map(compactObject).filter((item) => item !== undefined);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== "" && item !== null && item !== undefined).map(([key, item]) => [key, compactObject(item)]));
  return value;
}

export function parseFaqLines(value) {
  const rows = String(value ?? "").split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  return rows.map((line, index) => {
    const separator = line.indexOf("|");
    if (separator < 1 || separator === line.length - 1) throw new Error(`FAQ line ${index + 1} must use: Question | Answer`);
    return { question: line.slice(0, separator).trim(), answer: line.slice(separator + 1).trim() };
  });
}

export function buildSchemaMarkup(type, values) {
  const schemaType = String(type || "Organization");
  let data;
  if (schemaType === "Organization") {
    data = { "@context": "https://schema.org", "@type": "Organization", name: String(values.name ?? "").trim(), url: absoluteHttpUrl(values.url, "Organization URL"), logo: absoluteHttpUrl(values.image, "Logo URL", true), email: String(values.email ?? "").trim() };
  } else if (schemaType === "WebSite") {
    data = { "@context": "https://schema.org", "@type": "WebSite", name: String(values.name ?? "").trim(), url: absoluteHttpUrl(values.url, "Website URL"), description: String(values.description ?? "").trim(), inLanguage: String(values.language || "en").trim() };
  } else if (schemaType === "Article") {
    data = { "@context": "https://schema.org", "@type": "Article", headline: String(values.name ?? "").trim(), description: String(values.description ?? "").trim(), mainEntityOfPage: absoluteHttpUrl(values.url, "Article URL"), image: absoluteHttpUrl(values.image, "Image URL", true), datePublished: String(values.datePublished ?? "").trim(), dateModified: String(values.dateModified ?? "").trim(), author: { "@type": "Person", name: String(values.author ?? "").trim() } };
  } else if (schemaType === "FAQPage") {
    const faqs = parseFaqLines(values.faqs);
    if (!faqs.length) throw new Error("Enter at least one FAQ question and answer.");
    data = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  } else throw new Error("Choose a supported schema type.");
  const compact = compactObject(data);
  if (schemaType !== "FAQPage" && !(compact.name || compact.headline)) throw new Error("Enter a name or headline.");
  const json = JSON.stringify(compact, null, 2);
  return { json, script: `<script type="application/ld+json">\n${json}\n</script>`, data: compact };
}
