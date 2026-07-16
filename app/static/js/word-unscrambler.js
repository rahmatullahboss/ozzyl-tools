import { showToast } from "./app.js";

const DICTIONARY_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt";
const CACHE_KEY = "ozzyl-word-dictionary:v1";
const SETTINGS_KEY = "ozzyl-word-unscrambler:v1";
const MAX_RESULTS = 300;

const FALLBACK_WORDS = `
act add age ago aid aim air ale all also am an and angel ant any ape arc are arm art as ash ask ate away
bad bag ban bar bat be bed bee been below best bet big bin bit blue boat body book box boy bread bus but buy
cab can cap car care cat cell chat city class clear close code cold come cook copy cost could cow create cup cut
day deal dear did die dig dog done door dot down draw ear earth east easy eat edge else end enter era even ever eye
face fact far farm fast fat fear feed feel feet fell few field file fill film find fine fire first fit five flat flow fly
food foot for form four free from full fun game gave get gift girl give go goal gold good got great green group grow
had hand hard has hat have he head hear heart heat help her here high hill him his hit home hope hot hour house how
ice idea if in into is it item its job join joy just keep key kid kind king know land large last late law lead learn leave
left leg let letter life light like line list listen little live long look lot love low made mail make man many map mark
may me mean meet men might mind miss money month moon more most move much music must my name near need never new next
nice night no north not note now number of off old on once one only open or order other our out over own page paper park
part pay pen people per phone photo place plan play point post power price print problem product put quick rain read real
red rest return right river road room round run said sale same save say school sea search see sell send set she ship shop
short show side sign silent simple since sing site six size small so soft some song soon sort sound south space special
stand star start state stay step still stop store story street strong study such sun sure system table take talk taste
team tell ten test text than that the their them then there these they thing think this three through time to today together
top total town tree true try turn two under unit up us use user value very view visit wait walk want war was water way we
web week well were west what when where which white who why will window with woman word work world would write year yes you
your zero
alert alter later ratel artel
angel angle glean lange
below bowel elbow
bored robed
brag garb grab
care race acre
cider cried
credit direct
cried cider
dusty study
earth heart hater
elbow below bowel
evil live veil vile
fired fried
finder friend
fresher refresh
heart earth hater
inch chin
listen silent enlist inlets tinsel
loop pool polo
night thing
notes onset stone tones
save vase
state taste
stressed desserts
thing night
traces caters reacts crates
`.trim();

export function normalizeLetters(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 15);
}

export function parseDictionary(text) {
  const words = String(text ?? "")
    .split(/\s+/)
    .map(normalizeLetters)
    .filter((word) => word.length >= 2 && word.length <= 15);
  return [...new Set(words)];
}

function countLetters(value) {
  const counts = new Uint8Array(26);
  for (const letter of value) counts[letter.charCodeAt(0) - 97] += 1;
  return counts;
}

export function canBuildWord(word, letters, exact = false) {
  const normalizedWord = normalizeLetters(word);
  const normalizedLetters = normalizeLetters(letters);
  if (!normalizedWord || normalizedWord.length > normalizedLetters.length) return false;
  if (exact && normalizedWord.length !== normalizedLetters.length) return false;

  const available = countLetters(normalizedLetters);
  for (const letter of normalizedWord) {
    const index = letter.charCodeAt(0) - 97;
    if (available[index] === 0) return false;
    available[index] -= 1;
  }
  return true;
}

export function findWords(
  dictionary,
  letters,
  { exact = false, minimumLength = 3, limit = MAX_RESULTS } = {},
) {
  const normalizedLetters = normalizeLetters(letters);
  const minimum = Math.max(2, Number(minimumLength) || 2);
  if (normalizedLetters.length < 2) return [];

  return [...new Set(dictionary)]
    .filter(
      (word) =>
        word.length >= minimum &&
        word.length <= normalizedLetters.length &&
        canBuildWord(word, normalizedLetters, exact),
    )
    .sort((left, right) => right.length - left.length || left.localeCompare(right))
    .slice(0, limit);
}

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }
}

async function loadDictionary() {
  const fallback = parseDictionary(FALLBACK_WORDS);
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const cachedWords = parseDictionary(cached);
      if (cachedWords.length > 1000) {
        return { words: [...new Set([...cachedWords, ...fallback])], source: "cached" };
      }
    }
  } catch {
    // Continue to the network request.
  }

  try {
    const response = await fetch(DICTIONARY_URL, { mode: "cors", cache: "force-cache" });
    if (!response.ok) throw new Error(`Dictionary request failed: ${response.status}`);
    const remoteWords = parseDictionary(await response.text());
    const words = [...new Set([...remoteWords, ...fallback])];
    try {
      localStorage.setItem(CACHE_KEY, words.join("\n"));
    } catch {
      // The tool still works when the cache cannot be saved.
    }
    return { words, source: "remote" };
  } catch {
    return { words: fallback, source: "fallback" };
  }
}

function initWordUnscrambler(root) {
  const form = root.querySelector("[data-unscrambler-form]");
  const input = root.querySelector("[data-letters]");
  const mode = root.querySelector("[data-match-mode]");
  const minimumLength = root.querySelector("[data-minimum-length]");
  const letterCount = root.querySelector("[data-letter-count]");
  const error = root.querySelector("[data-letters-error]");
  const status = root.querySelector("[data-dictionary-status]");
  const summary = root.querySelector("[data-word-summary]");
  const results = root.querySelector("[data-word-results]");
  const empty = root.querySelector("[data-word-empty]");
  const toolbar = root.querySelector("[data-result-toolbar]");
  const visibleCount = root.querySelector("[data-visible-count]");
  const copyButton = root.querySelector("[data-copy-words]");
  let dictionary = parseDictionary(FALLBACK_WORDS);
  let latestWords = [];

  const setStatus = (source) => {
    status.classList.remove("is-ready", "is-fallback");
    if (source === "fallback") {
      status.classList.add("is-fallback");
      status.lastChild.textContent = " Offline dictionary";
      return;
    }
    status.classList.add("is-ready");
    status.lastChild.textContent = source === "cached" ? " Dictionary cached" : " Dictionary ready";
  };

  const validate = () => {
    const normalized = normalizeLetters(input.value);
    input.value = normalized;
    letterCount.textContent = `${normalized.length}/15`;
    let message = "";
    if (normalized.length > 0 && normalized.length < 2) message = "Enter at least 2 letters.";
    input.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;
    return !message && normalized.length >= 2;
  };

  const render = () => {
    if (!validate()) return;
    const letters = input.value;
    const exact = mode.value === "exact";
    latestWords = findWords(dictionary, letters, {
      exact,
      minimumLength: Number(minimumLength.value),
    });

    results.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const word of latestWords) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word-chip";
      button.dataset.word = word;
      const label = document.createElement("span");
      label.textContent = word;
      const length = document.createElement("small");
      length.textContent = `${word.length} letters`;
      button.append(label, length);
      fragment.append(button);
    }
    results.append(fragment);

    const matchLabel = exact ? "exact anagram" : "possible word";
    summary.innerHTML = latestWords.length
      ? `<strong>${latestWords.length}</strong> ${latestWords.length === 1 ? matchLabel : `${matchLabel}s`} found from <strong>${letters}</strong>.`
      : `No ${exact ? "exact anagrams" : "matching words"} found for <strong>${letters}</strong>. Try a shorter minimum length.`;
    empty.hidden = latestWords.length > 0;
    toolbar.hidden = latestWords.length === 0;
    visibleCount.textContent = latestWords.length === MAX_RESULTS ? `Showing first ${MAX_RESULTS}` : `${latestWords.length} results`;
    saveSettings({ letters, mode: mode.value, minimumLength: minimumLength.value });
  };

  const clearResults = () => {
    latestWords = [];
    results.replaceChildren();
    toolbar.hidden = true;
    empty.hidden = false;
    summary.textContent = "Enter letters to find matching words.";
  };

  const settings = readSettings();
  const params = new URLSearchParams(location.search);
  input.value = normalizeLetters(params.get("letters") ?? settings.letters ?? "");
  mode.value = params.get("mode") ?? settings.mode ?? "all";
  minimumLength.value = params.get("min") ?? settings.minimumLength ?? "3";
  validate();
  if (input.value.length >= 2) render();

  loadDictionary().then(({ words, source }) => {
    dictionary = words;
    setStatus(source);
    if (input.value.length >= 2) render();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (validate()) render();
  });

  input.addEventListener("input", () => {
    const original = input.value;
    validate();
    if (original !== input.value) showToast("Only English letters are used.");
    if (!input.value) clearResults();
  });

  mode.addEventListener("change", () => {
    if (validate()) render();
  });
  minimumLength.addEventListener("change", () => {
    if (validate()) render();
  });

  for (const example of root.querySelectorAll("[data-example]")) {
    example.addEventListener("click", () => {
      input.value = example.dataset.example;
      validate();
      render();
      input.focus();
    });
  }

  root.querySelector("[data-reset-unscrambler]")?.addEventListener("click", () => {
    input.value = "";
    mode.value = "all";
    minimumLength.value = "3";
    localStorage.removeItem(SETTINGS_KEY);
    history.replaceState(null, "", location.pathname);
    validate();
    clearResults();
    input.focus();
    showToast("Word unscrambler reset.");
  });

  results.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-word]");
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.word);
      showToast(`${button.dataset.word} copied.`);
    } catch {
      showToast("Could not access the clipboard.", "error");
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(latestWords.join("\n"));
      showToast("Words copied.");
    } catch {
      showToast("Could not access the clipboard.", "error");
    }
  });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-word-unscrambler]");
  if (root) initWordUnscrambler(root);
}
