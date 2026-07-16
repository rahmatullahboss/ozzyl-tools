import { showToast } from "./app.js";

const WORDS_PER_MINUTE = 200;
const SPEAKING_WORDS_PER_MINUTE = 130;
const AMBIGUOUS_CHARACTERS = new Set("O0Il1|".split(""));

export function analyzeText(value) {
  const text = String(value ?? "");
  const trimmed = text.trim();
  const words = trimmed.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [];
  const sentenceParts = trimmed
    ? trimmed.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []
    : [];
  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/).filter((paragraph) => paragraph.trim())
    : [];

  return {
    words: words.length,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/gu, "").length,
    sentences: sentenceParts.filter((sentence) => sentence.trim()).length,
    paragraphs: paragraphs.length,
    readingMinutes: words.length / WORDS_PER_MINUTE,
    speakingMinutes: words.length / SPEAKING_WORDS_PER_MINUTE,
  };
}

function uppercaseFirstLetters(value) {
  return value.replace(
    /(^|[.!?]\s+)([\p{L}])/gu,
    (_match, prefix, letter) => `${prefix}${letter.toUpperCase()}`,
  );
}

export function convertCase(value, mode) {
  const text = String(value ?? "");
  if (mode === "upper") return text.toUpperCase();
  if (mode === "lower") return text.toLowerCase();
  if (mode === "title") {
    return text
      .toLowerCase()
      .replace(
        /(^|[^\p{L}\p{N}])([\p{L}])/gu,
        (_match, prefix, letter) => `${prefix}${letter.toUpperCase()}`,
      );
  }
  if (mode === "sentence") return uppercaseFirstLetters(text.toLowerCase());
  return text;
}

export function calculatePercentage(mode, first, second) {
  const a = Number(first);
  const b = Number(second);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  if (mode === "of") return (a / 100) * b;
  if (mode === "what") return b === 0 ? null : (a / b) * 100;
  if (mode === "change") return a === 0 ? null : ((b - a) / Math.abs(a)) * 100;
  return null;
}

function secureRandomInt(maximum) {
  if (!Number.isInteger(maximum) || maximum <= 0) {
    throw new RangeError("Maximum must be a positive integer.");
  }
  const range = 0x100000000;
  const limit = Math.floor(range / maximum) * maximum;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % maximum;
}

function filteredPool(pool, excludeAmbiguous) {
  if (!excludeAmbiguous) return pool;
  return [...pool].filter((character) => !AMBIGUOUS_CHARACTERS.has(character)).join("");
}

export function generatePassword(
  {
    length = 16,
    lowercase = true,
    uppercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false,
  } = {},
  randomInt = secureRandomInt,
) {
  const requestedLength = Math.min(64, Math.max(8, Math.round(Number(length) || 16)));
  const enabledPools = [
    lowercase ? filteredPool("abcdefghijklmnopqrstuvwxyz", excludeAmbiguous) : "",
    uppercase ? filteredPool("ABCDEFGHIJKLMNOPQRSTUVWXYZ", excludeAmbiguous) : "",
    numbers ? filteredPool("0123456789", excludeAmbiguous) : "",
    symbols ? filteredPool("!@#$%^&*()-_=+[]{};:,.?", excludeAmbiguous) : "",
  ].filter(Boolean);

  if (!enabledPools.length) throw new Error("Select at least one character type.");

  const finalLength = Math.max(requestedLength, enabledPools.length);
  const combined = enabledPools.join("");
  const characters = enabledPools.map(
    (pool) => pool[randomInt(pool.length)],
  );

  while (characters.length < finalLength) {
    characters.push(combined[randomInt(combined.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join("");
}

export function passwordStrength(password) {
  const value = String(password ?? "");
  const typeCount = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  let score = 0;
  if (value.length >= 10) score += 1;
  if (value.length >= 14) score += 1;
  if (value.length >= 20) score += 1;
  if (typeCount >= 3) score += 1;
  if (typeCount === 4) score += 1;

  const boundedScore = Math.min(4, score);
  const labels = ["Weak", "Fair", "Good", "Strong", "Very strong"];
  return { score: boundedScore, label: labels[boundedScore], typeCount };
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function formatMinutes(value) {
  if (!value) return "0 min";
  if (value < 1) return "< 1 min";
  return `${formatNumber(value, 1)} min`;
}

async function copyText(value, successMessage) {
  if (!value) {
    showToast("There is nothing to copy.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    showToast(successMessage);
  } catch {
    showToast("Could not access the clipboard.", "error");
  }
}

function initWordCounter(root) {
  const input = root.querySelector("[data-word-input]");
  const stats = Object.fromEntries(
    [...root.querySelectorAll("[data-text-stat]")].map((element) => [
      element.dataset.textStat,
      element,
    ]),
  );

  const update = () => {
    const analysis = analyzeText(input.value);
    for (const key of ["words", "characters", "charactersNoSpaces", "sentences", "paragraphs"]) {
      stats[key].textContent = formatNumber(analysis[key], 0);
    }
    stats.readingMinutes.textContent = formatMinutes(analysis.readingMinutes);
    stats.speakingMinutes.textContent = formatMinutes(analysis.speakingMinutes);
  };

  input.addEventListener("input", update);
  root.querySelector("[data-clear-text]")?.addEventListener("click", () => {
    input.value = "";
    update();
    input.focus();
    showToast("Text cleared.");
  });
  root.querySelector("[data-copy-text]")?.addEventListener("click", () =>
    copyText(input.value, "Text copied."),
  );
  update();
}

function initCaseConverter(root) {
  const input = root.querySelector("[data-case-input]");
  const output = root.querySelector("[data-case-output]");
  const convert = (mode) => {
    output.value = convertCase(input.value, mode);
    output.dataset.mode = mode;
  };

  for (const button of root.querySelectorAll("[data-case-mode]")) {
    button.addEventListener("click", () => convert(button.dataset.caseMode));
  }
  root.querySelector("[data-copy-case]")?.addEventListener("click", () =>
    copyText(output.value, "Converted text copied."),
  );
  root.querySelector("[data-clear-case]")?.addEventListener("click", () => {
    input.value = "";
    output.value = "";
    input.focus();
    showToast("Text cleared.");
  });
  input.addEventListener("input", () => {
    if (output.dataset.mode) convert(output.dataset.mode);
  });
}

function initPercentageCalculator(root) {
  const mode = root.querySelector("[data-percentage-mode]");
  const first = root.querySelector("[data-percentage-first]");
  const second = root.querySelector("[data-percentage-second]");
  const firstLabel = root.querySelector("[data-first-label]");
  const secondLabel = root.querySelector("[data-second-label]");
  const result = root.querySelector("[data-percentage-result]");
  const explanation = root.querySelector("[data-percentage-explanation]");

  const labels = {
    of: ["Percentage", "Number"],
    what: ["Part", "Whole"],
    change: ["Original value", "New value"],
  };

  const update = () => {
    [firstLabel.textContent, secondLabel.textContent] = labels[mode.value];
    const calculated = calculatePercentage(mode.value, first.value, second.value);
    if (calculated === null) {
      result.textContent = "—";
      explanation.textContent =
        mode.value === "what"
          ? "The whole value must not be zero."
          : mode.value === "change"
            ? "The original value must not be zero."
            : "Enter two valid numbers.";
      return;
    }

    const formatted = formatNumber(calculated, 4);
    result.textContent = mode.value === "of" ? formatted : `${formatted}%`;
    if (mode.value === "of") {
      explanation.textContent = `${first.value}% of ${second.value} is ${formatted}.`;
    } else if (mode.value === "what") {
      explanation.textContent = `${first.value} is ${formatted}% of ${second.value}.`;
    } else {
      const direction = calculated >= 0 ? "increase" : "decrease";
      explanation.textContent = `The percentage ${direction} is ${formatNumber(Math.abs(calculated), 4)}%.`;
    }
  };

  for (const control of [mode, first, second]) {
    control.addEventListener("input", update);
    control.addEventListener("change", update);
  }
  root.querySelector("[data-reset-percentage]")?.addEventListener("click", () => {
    mode.value = "of";
    first.value = "20";
    second.value = "150";
    update();
    showToast("Percentage calculator reset.");
  });
  update();
}

function initPasswordGenerator(root) {
  const output = root.querySelector("[data-password-output]");
  const length = root.querySelector("[data-password-length]");
  const lengthValue = root.querySelector("[data-password-length-value]");
  const strengthLabel = root.querySelector("[data-password-strength]");
  const strengthBar = root.querySelector("[data-password-strength-bar]");
  const checkboxes = [...root.querySelectorAll("[data-password-option]")];

  const generate = () => {
    const options = Object.fromEntries(
      checkboxes.map((checkbox) => [checkbox.value, checkbox.checked]),
    );
    options.length = Number(length.value);
    lengthValue.textContent = length.value;

    try {
      output.value = generatePassword(options);
      const strength = passwordStrength(output.value);
      strengthLabel.textContent = strength.label;
      strengthBar.dataset.score = String(strength.score);
      strengthBar.style.setProperty("--strength", `${(strength.score + 1) * 20}%`);
    } catch (error) {
      output.value = "";
      strengthLabel.textContent = "Select an option";
      strengthBar.dataset.score = "0";
      strengthBar.style.setProperty("--strength", "0%");
      showToast(error.message, "error");
    }
  };

  length.addEventListener("input", generate);
  for (const checkbox of checkboxes) checkbox.addEventListener("change", generate);
  root.querySelector("[data-generate-password]")?.addEventListener("click", generate);
  root.querySelector("[data-copy-password]")?.addEventListener("click", () =>
    copyText(output.value, "Password copied."),
  );
  generate();
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-utility-kind]");
  if (root?.dataset.utilityKind === "word_counter") initWordCounter(root);
  if (root?.dataset.utilityKind === "case_converter") initCaseConverter(root);
  if (root?.dataset.utilityKind === "percentage") initPercentageCalculator(root);
  if (root?.dataset.utilityKind === "password") initPasswordGenerator(root);
}
