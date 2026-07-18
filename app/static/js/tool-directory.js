function normalized(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/gu, " ");
}

function updateQueryParameter(value) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("q", value);
  else url.searchParams.delete("q");
  window.history.replaceState({}, "", url);
}

function initDirectory() {
  const root = document.querySelector("[data-directory-root]");
  if (!root) return;

  const input = root.querySelector("[data-directory-search]");
  const cards = [...root.querySelectorAll("[data-directory-item]")];
  const sections = [...root.querySelectorAll("[data-directory-section]")];
  const filters = [...root.querySelectorAll("[data-directory-filter]")];
  const count = root.querySelector("[data-directory-visible-count]");
  const empty = root.querySelector("[data-directory-empty]");
  let activeGroup = root.dataset.initialGroup || "all";

  const render = () => {
    const query = normalized(input?.value);
    let visibleCount = 0;

    for (const card of cards) {
      const matchesQuery = !query || normalized(card.dataset.searchText).includes(query);
      const matchesGroup = activeGroup === "all" || card.dataset.group === activeGroup;
      card.hidden = !(matchesQuery && matchesGroup);
      if (!card.hidden) visibleCount += 1;
    }

    for (const section of sections) {
      const visibleCards = [...section.querySelectorAll("[data-directory-item]")].some(
        (card) => !card.hidden,
      );
      section.hidden = !visibleCards;
    }

    if (count) count.textContent = String(visibleCount);
    if (empty) empty.hidden = visibleCount !== 0;
    updateQueryParameter(query);
  };

  for (const filter of filters) {
    filter.addEventListener("click", () => {
      activeGroup = filter.dataset.directoryFilter || "all";
      for (const candidate of filters) {
        const selected = candidate === filter;
        candidate.classList.toggle("is-active", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      }
      render();
    });
  }

  input?.addEventListener("input", render);
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      input.value = "";
      render();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !/INPUT|TEXTAREA|SELECT/u.test(document.activeElement?.tagName || "")
    ) {
      event.preventDefault();
      input?.focus();
    }
  });

  const initialQuery = new URL(window.location.href).searchParams.get("q") || "";
  if (input && initialQuery) input.value = initialQuery;
  render();
}

if (typeof document !== "undefined") initDirectory();

export { normalized };
