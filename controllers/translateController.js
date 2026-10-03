import fs from "node:fs";
import path from "node:path";
import {
  translateText,
  batchTranslate,
  detectLanguage,
  getSupportedLanguages,
} from "../services/translateService.js";
import { getCachedAudioFile, getAudioUrl } from "../services/ttsService.js";
import { getWordDetails } from "../services/dictionaryService.js";

/**
 * Handle general text translation.
 * Supports auto-detection, optional TTS audio, and dictionary examples for single words.
 *
 * @route POST /api/v1/translate
 */
export const translate = async (req, res, next) => {
  try {
    const {
      text,
      from = "auto",
      to = "ar",
      includeAudio = true,
      includeExample = true,
    } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Field 'text' is required and must be a non-empty string.",
      });
    }

    const cleanText = text.trim();
    const translationResult = await translateText({ text: cleanText, from, to });

    const isSingleWord = !cleanText.includes(" ");
    let dictionaryInfo = null;
    let exampleOriginal = null;
    let exampleTranslated = null;

    // If requested and it's a single word, attempt dictionary enrichment
    if (includeExample && isSingleWord) {
      dictionaryInfo = await getWordDetails(cleanText, translationResult.sourceLang);
      if (dictionaryInfo?.example) {
        exampleOriginal = dictionaryInfo.example;
        try {
          const exTranslation = await translateText({
            text: exampleOriginal,
            from: translationResult.sourceLang,
            to,
          });
          exampleTranslated = exTranslation.translatedText;
        } catch (err) {
          // If example translation fails, continue without blocking
        }
      }
    }

    // Audio synthesis / caching
    let audio = null;
    if (includeAudio) {
      const [audioOriginal, audioTranslated] = await Promise.all([
        getCachedAudioFile({ text: cleanText, lang: translationResult.sourceLang }),
        getCachedAudioFile({ text: translationResult.translatedText, lang: to }),
      ]);

      let audioExampleOriginal = null;
      let audioExampleTranslated = null;

      if (exampleOriginal) {
        [audioExampleOriginal, audioExampleTranslated] = await Promise.all([
          getCachedAudioFile({ text: exampleOriginal, lang: translationResult.sourceLang }),
          exampleTranslated
            ? getCachedAudioFile({ text: exampleTranslated, lang: to })
            : null,
        ]);
      }

      audio = {
        original: audioOriginal,
        translation: audioTranslated,
        exampleOriginal: audioExampleOriginal,
        exampleTranslated: audioExampleTranslated,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        original: cleanText,
        translation: translationResult.translatedText,
        sourceLang: translationResult.sourceLang,
        sourceLangName: translationResult.sourceLangName,
        targetLang: translationResult.targetLang,
        targetLangName: translationResult.targetLangName,
        phonetic: dictionaryInfo?.phonetic || null,
        partOfSpeech: dictionaryInfo?.partOfSpeech || null,
        definition: dictionaryInfo?.definition || null,
        synonyms: dictionaryInfo?.synonyms || [],
        exampleOriginal: exampleOriginal || null,
        exampleTranslated: exampleTranslated || null,
        audio,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle dedicated word translation with dictionary metadata.
 *
 * @route POST /api/v1/translate/word
 */
export const translateWord = async (req, res, next) => {
  try {
    const { word, source = "en", target = "ar" } = req.body;

    if (!word || typeof word !== "string" || !word.trim()) {
      return res.status(400).json({
        success: false,
        message: "Field 'word' is required.",
      });
    }

    const cleanWord = word.trim();
    const translation = await translateText({ text: cleanWord, from: source, to: target });
    const dictionary = await getWordDetails(cleanWord, translation.sourceLang);

    let exampleOriginal = dictionary?.example || `I like to read a good ${cleanWord} before bed.`;
    let exampleTranslated = null;

    try {
      const exTrans = await translateText({
        text: exampleOriginal,
        from: translation.sourceLang,
        to: target,
      });
      exampleTranslated = exTrans.translatedText;
    } catch {
      // Ignore example translation failure
    }

    const [audioOriginal, audioTranslated, audioExOriginal, audioExTranslated] =
      await Promise.all([
        getCachedAudioFile({ text: cleanWord, lang: translation.sourceLang }),
        getCachedAudioFile({ text: translation.translatedText, lang: target }),
        getCachedAudioFile({ text: exampleOriginal, lang: translation.sourceLang }),
        exampleTranslated
          ? getCachedAudioFile({ text: exampleTranslated, lang: target })
          : null,
      ]);

    return res.status(200).json({
      success: true,
      data: {
        original: cleanWord,
        translation: translation.translatedText,
        sourceLang: translation.sourceLang,
        targetLang: target,
        phonetic: dictionary?.phonetic || null,
        definition: dictionary?.definition || null,
        partOfSpeech: dictionary?.partOfSpeech || null,
        synonyms: dictionary?.synonyms || [],
        exampleOriginal,
        exampleTranslated,
        audio: {
          original: audioOriginal,
          translation: audioTranslated,
          exampleOriginal: audioExOriginal,
          exampleTranslated: audioExTranslated,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch translation handler.
 *
 * @route POST /api/v1/translate/batch
 */
export const batch = async (req, res, next) => {
  try {
    const { texts, from = "auto", to = "ar" } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Field 'texts' must be a non-empty array of strings.",
      });
    }

    const results = await batchTranslate({ texts, from, to });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Language detection handler.
 *
 * @route POST /api/v1/translate/detect
 */
export const detect = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Field 'text' is required for language detection.",
      });
    }

    const detection = await detectLanguage(text);

    return res.status(200).json({
      success: true,
      data: detection,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all supported languages.
 *
 * @route GET /api/v1/translate/languages
 */
export const getLanguages = (req, res) => {
  const languages = getSupportedLanguages();
  return res.status(200).json({
    success: true,
    count: languages.length,
    data: languages,
  });
};

/**
 * Direct TTS audio generation / streaming handler.
 *
 * @route GET /api/v1/translate/tts
 */
export const getTTS = async (req, res, next) => {
  try {
    const { text, lang = "en", download = false } = req.query;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'text' is required.",
      });
    }

    const audioUrl = await getCachedAudioFile({ text, lang });

    if (!audioUrl) {
      return res.status(500).json({
        success: false,
        message: "Could not generate audio for the specified text.",
      });
    }

    if (download === "true" || download === true) {
      return res.redirect(audioUrl);
    }

    return res.status(200).json({
      success: true,
      data: {
        text,
        lang,
        audioUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sample translations dataset.
 *
 * @route GET /api/v1/translate/samples
 */
export const getSamples = async (req, res, next) => {
  try {
    const filePath = path.resolve(process.cwd(), "data", "sampleTranslations.json");
    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return res.status(200).json({
        success: true,
        data: JSON.parse(content),
      });
    }

    return res.status(404).json({
      success: false,
      message: "Sample translations file not found.",
    });
  } catch (error) {
    next(error);
  }
};
