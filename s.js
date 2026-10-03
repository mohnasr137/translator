import express from "express";
import { translate } from "@vitalets/google-translate-api";

const app = express();
app.use(express.json());

function makeGoogleTTSUrl(text, lang) {
  const baseUrl = "https://translate.google.com/translate_tts";
  const url = new URL(baseUrl);
  url.searchParams.append("ie", "UTF-8");
  url.searchParams.append("q", text);
  url.searchParams.append("tl", lang);
  url.searchParams.append("client", "gtx");
  // Note: Google may restrict usage without proper headers or tokens
  return url.toString();
}

app.post("/translate-word", async (req, res) => {
  try {
    const { word, source = "en", target = "ar" } = req.body;

    // Translate the word
    const translationResult = await translate(word, { from: source, to: target });

    // Hardcoded example sentence (you can replace this)
    const exampleOriginal = `I like to read a good ${word} before bed.`;
    const exampleTranslated = await translate(exampleOriginal, { from: source, to: target });

    // Construct audio URLs manually
    const audioOriginal = makeGoogleTTSUrl(word, source);
    const audioTranslated = makeGoogleTTSUrl(translationResult.text, target);
    const audioExampleOriginal = makeGoogleTTSUrl(exampleOriginal, source);
    const audioExampleTranslated = makeGoogleTTSUrl(exampleTranslated.text, target);

    res.json({
      original: word,
      translation: translationResult.text,
      exampleOriginal,
      exampleTranslated: exampleTranslated.text,
      audioOriginal,
      audioTranslated,
      audioExampleOriginal,
      audioExampleTranslated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Translation or audio URL generation failed." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
