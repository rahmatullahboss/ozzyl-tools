export function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

export function rankToolMatches(tools, query, limit = 8) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return [];
  const tokens = normalizedQuery.split(" ");

  return tools
    .map((tool) => {
      const name = normalizeSearch(tool.name);
      const shortName = normalizeSearch(tool.short_name);
      const searchable = normalizeSearch(
        `${tool.search_text || ""} ${tool.summary || ""} ${tool.category || ""} ${tool.family || ""}`,
      );
      if (!tokens.every((token) => searchable.includes(token) || name.includes(token))) return null;
      let score = 0;
      if (shortName === normalizedQuery || name === normalizedQuery) score += 100;
      if (shortName.startsWith(normalizedQuery) || name.startsWith(normalizedQuery)) score += 60;
      if (shortName.includes(normalizedQuery) || name.includes(normalizedQuery)) score += 35;
      if (searchable.includes(normalizedQuery)) score += 15;
      score += Math.max(0, 10 - name.length / 20);
      return { tool, score };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.tool.name.localeCompare(right.tool.name))
    .slice(0, limit)
    .map((entry) => entry.tool);
}
