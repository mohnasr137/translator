import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import googleTTS from "google-tts-api";

// Ensure audio cache directory exists
const audioRootDir = path.resolve(process.cwd(), "audio");
const audioCacheDir = path.resolve(audioRootDir, "cache");

if (!fs.existsSync(audioCacheDir)) {
  fs.mkdirSync(audioCacheDir, { recursive: true });
}

/**
 * Generate a direct Google TTS URL.
 * @param {Object} options
 * @param {string} options.text - Text to convert to speech
 * @param {string} [options.lang='en'] - Language code
 * @param {boolean} [options.slow=false] - Normal or slow speed
 * @returns {string} Direct Google TTS URL
 */
export const getAudioUrl = ({ text, lang = "en", slow = false }) => {
  if (!text || typeof text !== "string") return null;
  try {
    return googleTTS.getAudioUrl(text.trim(), {
      lang: lang || "en",
      slow: Boolean(slow),
      host: "https://translate.google.com",
    });
  } catch (err) {
    console.error(`[TTS Service] Error generating audio URL for "${text}":`, err.message);
    return null;
  }
};

/**
 * Fetch and cache the TTS audio file locally as MP3.
 * Returns the public relative URL path (e.g., /audio/cache/en-12345.mp3).
 *
 * @param {Object} options
 * @param {string} options.text - Text to synthesize
 * @param {string} [options.lang='en'] - Language code
 * @param {boolean} [options.slow=false] - Speed
 * @returns {Promise<string|null>} Relative audio file URL or null
 */
export const getCachedAudioFile = async ({ text, lang = "en", slow = false }) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    return null;
  }

  const cleanText = text.trim();
  const cleanLang = (lang || "en").toLowerCase();

  try {
    // Generate deterministic hash based on text, lang, and speed
    const hash = crypto
      .createHash("md5")
      .update(`${cleanText}-${cleanLang}-${slow}`)
      .digest("hex")
      .slice(0, 16);

    const fileName = `${cleanLang}-${hash}.mp3`;
    const filePath = path.join(audioCacheDir, fileName);

    // If file already exists in cache, return immediately
    if (fs.existsSync(filePath)) {
      return `/audio/cache/${fileName}`;
    }

    // Generate download URL from Google TTS
    const url = getAudioUrl({ text: cleanText, lang: cleanLang, slow });
    if (!url) return null;

    // Fetch the audio buffer
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[TTS Service] Google TTS returned status ${response.status} for "${cleanText}"`);
      return url; // Fallback to direct URL if download fails
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));

    return `/audio/cache/${fileName}`;
  } catch (error) {
    console.error(`[TTS Service] Failed caching audio for "${cleanText}":`, error.message);
    // Return direct TTS URL as fallback
    return getAudioUrl({ text: cleanText, lang: cleanLang, slow });
  }
};
