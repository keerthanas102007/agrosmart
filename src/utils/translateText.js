/**
 * translateText.js
 * Free translation using MyMemory API (no API key required, 5000 chars/day free).
 * Results are cached in-memory to avoid duplicate calls.
 */

const cache = {}; // key: "text||targetLang" → translated string

/**
 * Translate a single string.
 * @param {string} text      - Source text (always English from DB)
 * @param {string} targetLang - "ta" | "hi" | "en"
 * @returns {Promise<string>}
 */
export async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  if (targetLang === "en") return text; // already English

  const cacheKey = `${text}||${targetLang}`;
  if (cache[cacheKey]) return cache[cacheKey];

  // MyMemory language codes
  const langMap = { ta: "ta-IN", hi: "hi-IN" };
  const to = langMap[targetLang] || "en-GB";

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en-GB|${to}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText || text;
    cache[cacheKey] = translated;
    return translated;
  } catch {
    // On failure, return original text silently
    return text;
  }
}

/**
 * Translate an array of strings (batch — runs in parallel).
 * @param {string[]} texts
 * @param {string}   targetLang
 * @returns {Promise<string[]>}
 */
export async function translateTexts(texts, targetLang) {
  return Promise.all(texts.map(t => translateText(t, targetLang)));
}
