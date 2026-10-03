import express from "express";
import fs from "fs";
import path from "path";
import pkg from "@vitalets/google-translate-api";
const { translate } = pkg;
import googleTTS from "google-tts-api";
import fetch from "node-fetch";
import crypto from "crypto";

const app = express();
app.use(express.json());

// Ensure audio folder exists
const audioDir = path.join(process.cwd(), "audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// Save and cache TTS audio
async function getCachedAudio(text, lang) {
  // Create short hash for the file name
  const hash = crypto.createHash("md5").update(text).digest("hex");
  const safeFileName = `${lang}-${hash}.mp3`;
  const filePath = path.join(audioDir, safeFileName);

  if (fs.existsSync(filePath)) {
    return `/audio/${safeFileName}`;
  }

  const url = googleTTS.getAudioUrl(text, { lang, slow: false });
  const audioRes = await fetch(url);
  const buffer = await audioRes.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));

  return `/audio/${safeFileName}`;
}

// Helper: Get example sentence
async function getExample(word, lang = "en") {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${word}`
    );
    const data = await res.json();

    if (Array.isArray(data) && data[0]?.meanings[0]?.definitions[0]?.example) {
      return data[0].meanings[0].definitions[0].example;
    }
  } catch (err) {
    console.error("Example fetch error:", err);
  }
  return null;
}

// Serve cached audio files
app.use("/audio", express.static(audioDir));

// Main translate route
app.post("/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body; // e.g. { text: "book", targetLang: "ar" }

    // Translate word
    const translation = await translate(text, { to: targetLang });

    // Get example
    const exampleOriginal = await getExample(text, "en");
    let exampleTranslated = null;
    if (exampleOriginal) {
      const exTrans = await translate(exampleOriginal, { to: targetLang });
      exampleTranslated = exTrans.text;
    }

    // Get cached audio URLs
    const audioOriginal = await getCachedAudio(text, "en");
    const audioTranslated = await getCachedAudio(translation.text, targetLang);
    const audioExampleOriginal = exampleOriginal
      ? await getCachedAudio(exampleOriginal, "en")
      : null;
    const audioExampleTranslated = exampleTranslated
      ? await getCachedAudio(exampleTranslated, targetLang)
      : null;

    res.json({
      original: text,
      translation: translation.text,
      exampleOriginal: exampleOriginal || "No example found",
      exampleTranslated: exampleTranslated || "No example found",
      audioOriginal,
      audioTranslated,
      audioExampleOriginal,
      audioExampleTranslated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation failed" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
