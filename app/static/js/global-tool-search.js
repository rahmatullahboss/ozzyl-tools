import { rankToolMatches } from "./tool-search-core.js";

let indexPromise;
function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch("/tools-index.json", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Tool index unavailable.");
        return response.json();
      })
      .then((payload) => (Array.isArray(payload.tools) ? payload.tools : []));
  }
  return indexPromise;
}

function initGlobalToolSearch() {
  const original = document.querySelector("[data-tool-search]");
  const originalResults = document.querySelector("[data-search-results]");
  if (!original || !originalResults) return;

  const search = original.cloneNode(true);
  const results = originalResults.cloneNode(false);
  original.replaceWith(search);
  originalResults.replaceWith(results);
  results.id = "global-tool-search-results";
  search.setAttribute("aria-controls", results.id);
  search.setAttribute("aria-expanded", "false");
  let sequence = 0;

  const hide = () => {
    results.hidden = true;
    search.setAttribute("aria-expanded", "false");
  };

  const render = async () => {
    const query = search.value.trim();
    const current = ++sequence;
    results.replaceChildren();
    if (!query) {
      hide();
      return;
    }

    try {
      const tools = await loadIndex();
      if (current !== sequence) return;
      const matches = rankToolMatches(tools, query, 8);
      for (const tool of matches) {
        const link = document.createElement("a");
        link.className = "search-result";
        link.href = tool.url;
        link.dataset.recentTool = tool.slug;
        link.innerHTML =
          '<span><strong></strong><small></small></span><b aria-hidden="true">→</b>';
        link.querySelector("strong").textContent = tool.short_name || tool.name;
        link.querySelector("small").textContent = `${tool.family} · ${tool.category}`;
        results.append(link);
      }
      if (!matches.length) {
        const message = document.createElement("div");
        message.className = "search-result";
        message.textContent = "No direct match found.";
        results.append(message);
      }
      const directory = document.createElement("a");
      directory.className = "search-result";
      directory.href = `/tools/?q=${encodeURIComponent(query)}`;
      directory.textContent = "Search the complete directory →";
      results.append(directory);
      results.hidden = false;
      search.setAttribute("aria-expanded", "true");
    } catch {
      const directory = document.createElement("a");
      directory.className = "search-result";
      directory.href = `/tools/?q=${encodeURIComponent(query)}`;
      directory.textContent = "Open the complete tool directory →";
      results.append(directory);
      results.hidden = false;
      search.setAttribute("aria-expanded", "true");
    }
  };

  search.addEventListener("input", render);
  search.addEventListener("focus", () => {
    if (search.value.trim()) render();
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      search.value = "";
      hide();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !/INPUT|TEXTAREA|SELECT/u.test(document.activeElement?.tagName || "")
    ) {
      event.preventDefault();
      search.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      !event.target.closest("[data-tool-search]") &&
      !event.target.closest("[data-search-results]")
    ) {
      hide();
    }
  });
}

if (typeof document !== "undefined") initGlobalToolSearch();
