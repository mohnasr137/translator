/**
 * Look up word definitions, phonetics, parts of speech, and example sentences.
 * Uses Free Dictionary API (https://dictionaryapi.dev/)
 *
 * @param {string} word - The single word to look up
 * @param {string} [lang='en'] - Language code (defaults to 'en')
 * @returns {Promise<Object|null>} Dictionary entry metadata or null if not found
 */
export const getWordDetails = async (word, lang = "en") => {
  if (!word || typeof word !== "string" || !word.trim()) {
    return null;
  }

  const cleanWord = word.trim().toLowerCase();

  // Dictionary API is only available for select languages, primarily 'en'
  if (lang !== "en") {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(cleanWord)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const entry = data[0];
    const phonetic = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || null;
    const dictionaryAudio = entry.phonetics?.find((p) => p.audio)?.audio || null;

    let partOfSpeech = null;
    let definition = null;
    let example = null;
    const synonyms = [];

    if (Array.isArray(entry.meanings)) {
      for (const meaning of entry.meanings) {
        if (!partOfSpeech && meaning.partOfSpeech) {
          partOfSpeech = meaning.partOfSpeech;
        }

        if (Array.isArray(meaning.synonyms)) {
          synonyms.push(...meaning.synonyms);
        }

        if (Array.isArray(meaning.definitions)) {
          for (const def of meaning.definitions) {
            if (!definition && def.definition) {
              definition = def.definition;
            }
            if (!example && def.example) {
              example = def.example;
            }
            if (definition && example) break;
          }
        }

        if (definition && example) break;
      }
    }

    return {
      word: cleanWord,
      phonetic,
      dictionaryAudio,
      partOfSpeech,
      definition,
      example,
      synonyms: [...new Set(synonyms)].slice(0, 5),
    };
  } catch (error) {
    // Graceful error recovery: dictionary lookup is an optional enhancement
    return null;
  }
};
