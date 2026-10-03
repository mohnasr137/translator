import { translate, languages } from "google-translate-api-x";

/**
 * Get the display name for a language code.
 * @param {string} code - ISO language code
 * @returns {string} Language name or the code itself
 */
export const getLanguageName = (code) => {
  if (!code) return "Unknown";
  const normalized = code.toLowerCase();
  return languages[normalized] || languages[code] || code;
};

/**
 * Translate a single string of text.
 * @param {Object} options
 * @param {string} options.text - Text to translate
 * @param {string} [options.from='auto'] - Source language code
 * @param {string} [options.to='en'] - Target language code
 * @returns {Promise<Object>} Translation result
 */
export const translateText = async ({ text, from = "auto", to = "en" }) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new Error("Text parameter is required and must be a non-empty string.");
  }

  const result = await translate(text.trim(), {
    from: from || "auto",
    to: to || "en",
  });

  const detectedSource = result.from?.language?.iso || from || "auto";

  return {
    originalText: text.trim(),
    translatedText: result.text,
    sourceLang: detectedSource,
    sourceLangName: getLanguageName(detectedSource),
    targetLang: to,
    targetLangName: getLanguageName(to),
    autoCorrected: result.from?.text?.autoCorrected || false,
    correctedValue: result.from?.text?.value || null,
  };
};

/**
 * Translate multiple texts in a single batch request.
 * @param {Object} options
 * @param {string[]} options.texts - Array of texts to translate
 * @param {string} [options.from='auto'] - Source language code
 * @param {string} [options.to='en'] - Target language code
 * @returns {Promise<Object[]>} Array of translation results
 */
export const batchTranslate = async ({ texts, from = "auto", to = "en" }) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Texts parameter must be a non-empty array of strings.");
  }

  const cleaned = texts.map((t) => (typeof t === "string" ? t.trim() : String(t)));
  const results = await translate(cleaned, {
    from: from || "auto",
    to: to || "en",
  });

  return results.map((res, index) => {
    const detectedSource = res.from?.language?.iso || from || "auto";
    return {
      originalText: cleaned[index],
      translatedText: res.text,
      sourceLang: detectedSource,
      sourceLangName: getLanguageName(detectedSource),
      targetLang: to,
      targetLangName: getLanguageName(to),
    };
  });
};

/**
 * Detect the language of a given text.
 * @param {string} text - Input text
 * @returns {Promise<Object>} Detection information
 */
export const detectLanguage = async (text) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new Error("Text parameter is required for language detection.");
  }

  const result = await translate(text.trim(), { from: "auto", to: "en" });
  const detectedCode = result.from?.language?.iso || "unknown";

  return {
    text: text.trim(),
    detectedLanguage: detectedCode,
    languageName: getLanguageName(detectedCode),
  };
};

/**
 * Get all supported languages as a clean array of { code, name }.
 * @returns {Array<{ code: string, name: string }>}
 */
export const getSupportedLanguages = () => {
  const list = [];
  const seen = new Set();

  for (const [key, value] of Object.entries(languages)) {
    // Skip 'auto' and skip keys that are full names (gtx has reverse mappings)
    if (key === "auto" || typeof value !== "string") continue;
    // Usually language codes are 2-5 chars (e.g. en, ar, zh-CN)
    if (key.length <= 8 && !seen.has(key)) {
      seen.add(key);
      list.push({
        code: key,
        name: value,
      });
    }
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
};
