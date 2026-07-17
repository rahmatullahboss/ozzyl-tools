import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeHeadingStructure,
  analyzeKeywordDensity,
  buildMetaTags,
  buildOpenGraphTags,
  buildRobotsTxt,
  buildSchemaMarkup,
  buildXmlSitemap,
  normalizeSitemapUrls,
  parseFaqLines,
  slugify,
  testRobotsPath,
} from "../../app/static/js/seo-tools-core.js";

test("meta tags validate canonical URL and report length warnings", () => {
  const result = buildMetaTags({
    title: "A useful title for a practical online tool that is intentionally too long",
    description: "A clear description for the page.",
    url: "https://example.com/tool",
  });
  assert.match(result.tags, /rel="canonical"/u);
  assert.equal(result.canonical, "https://example.com/tool");
  assert.ok(result.warnings.some((warning) => warning.includes("title")));
});

test("Open Graph builder adds a large image Twitter card when image exists", () => {
  const result = buildOpenGraphTags({
    title: "Example",
    description: "Example description",
    url: "https://example.com/page",
    image: "https://example.com/image.jpg",
    siteName: "Example Site",
    type: "article",
  });
  assert.equal(result.twitterCard, "summary_large_image");
  assert.match(result.tags, /og:image/u);
});

test("robots tester uses the longest matching rule and allow wins ties", () => {
  const text = "User-agent: *\nDisallow: /private\nAllow: /private/public\n";
  assert.equal(testRobotsPath(text, "Googlebot", "/private/file").allowed, false);
  assert.equal(testRobotsPath(text, "Googlebot", "/private/public/page").allowed, true);
});

test("robots builder normalizes paths and validates sitemap", () => {
  const output = buildRobotsTxt({
    userAgent: "*",
    allow: "public",
    disallow: "admin\n/tmp",
    sitemap: "https://example.com/sitemap.xml",
  });
  assert.match(output, /Allow: \/public/u);
  assert.match(output, /Disallow: \/admin/u);
  assert.match(output, /Sitemap: https:\/\/example.com\/sitemap.xml/u);
});

test("sitemap generator removes duplicates and escapes query parameters", () => {
  const input = "https://example.com/\nhttps://example.com/?a=1&b=2\nhttps://example.com/";
  const normalized = normalizeSitemapUrls(input);
  assert.equal(normalized.valid.length, 2);
  assert.equal(normalized.duplicates, 1);
  const result = buildXmlSitemap(input, { lastmod: "2026-07-18", changefreq: "weekly", priority: "0.8" });
  assert.match(result.xml, /a=1&amp;b=2/u);
  assert.match(result.xml, /<lastmod>2026-07-18<\/lastmod>/u);
});

test("FAQ schema lines require a separator and generate FAQPage JSON-LD", () => {
  assert.deepEqual(parseFaqLines("What is it? | A useful tool."), [
    { question: "What is it?", answer: "A useful tool." },
  ]);
  const result = buildSchemaMarkup("FAQPage", { faqs: "What is it? | A useful tool." });
  assert.equal(result.data["@type"], "FAQPage");
  assert.equal(result.data.mainEntity[0].acceptedAnswer.text, "A useful tool.");
});

test("Organization schema omits empty optional values", () => {
  const result = buildSchemaMarkup("Organization", {
    name: "Ozzyl Tools",
    url: "https://example.com",
    image: "",
    email: "",
  });
  assert.equal(result.data.name, "Ozzyl Tools");
  assert.equal("logo" in result.data, false);
});

test("slug generator supports ASCII and Unicode modes", () => {
  assert.equal(slugify("Crème & Coffee Guide", { preserveUnicode: false }), "creme-coffee-guide");
  assert.equal(slugify("বাংলা টুলস", { preserveUnicode: true }), "বাংলা-টুলস");
  assert.equal(slugify("Hello World", { separator: "underscore" }), "hello_world");
});

test("keyword density counts words and excludes common stopwords", () => {
  const result = analyzeKeywordDensity("Tools for tools and useful tools.");
  assert.equal(result.words, 6);
  assert.equal(result.rows[0].term, "tools");
  assert.equal(result.rows[0].count, 3);
});

test("heading checker detects missing H1 and skipped levels", () => {
  const result = analyzeHeadingStructure("<h2>Overview</h2><h4>Details</h4>");
  assert.equal(result.h1Count, 0);
  assert.ok(result.issues.some((issue) => issue.includes("No H1")));
  assert.ok(result.issues.some((issue) => issue.includes("jumps")));
});

test("heading checker accepts a sensible outline", () => {
  const result = analyzeHeadingStructure("<h1>Title</h1><h2>Section</h2><h3>Detail</h3><h2>Next</h2>");
  assert.deepEqual(result.issues, []);
  assert.equal(result.maximumDepth, 3);
});
