import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSearch, rankToolMatches } from "../../app/static/js/tool-search-core.js";

const tools = [
  {
    slug: "meta-tag-serp-preview",
    name: "Meta Tag & SERP Preview Generator",
    short_name: "Meta & SERP Preview",
    summary: "Prepare search metadata.",
    category: "SEO",
    family: "Browser utility",
    search_text: "meta title description canonical search seo",
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    short_name: "Merge PDF",
    summary: "Combine PDF files.",
    category: "PDF",
    family: "PDF organizer",
    search_text: "merge combine pdf pages document",
  },
  {
    slug: "invoice-generator",
    name: "Invoice Generator",
    short_name: "Invoice",
    summary: "Create a professional invoice.",
    category: "Documents",
    family: "Document generator",
    search_text: "invoice bill customer document generator",
  },
];

test("normalizeSearch handles punctuation spacing and Unicode", () => {
  assert.equal(normalizeSearch("  Meta & SERP—Preview  "), "meta serp preview");
  assert.equal(normalizeSearch("বাংলা   টুল"), "বাংলা টুল");
});

test("rankToolMatches prioritizes an exact short name", () => {
  const matches = rankToolMatches(tools, "merge pdf");
  assert.equal(matches[0].slug, "merge-pdf");
});

test("rankToolMatches supports multiple search tokens", () => {
  const matches = rankToolMatches(tools, "customer invoice");
  assert.deepEqual(matches.map((tool) => tool.slug), ["invoice-generator"]);
});

test("rankToolMatches searches categories and families", () => {
  assert.equal(rankToolMatches(tools, "pdf organizer")[0].slug, "merge-pdf");
  assert.equal(rankToolMatches(tools, "seo canonical")[0].slug, "meta-tag-serp-preview");
});

test("rankToolMatches returns no result for blank or unrelated queries", () => {
  assert.deepEqual(rankToolMatches(tools, ""), []);
  assert.deepEqual(rankToolMatches(tools, "weather forecast"), []);
});

test("rankToolMatches respects the result limit", () => {
  const broad = tools.map((tool) => ({ ...tool, search_text: `${tool.search_text} tool` }));
  assert.equal(rankToolMatches(broad, "tool", 2).length, 2);
});
