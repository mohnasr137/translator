import assert from "node:assert";
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

const runTests = async () => {
  console.log("=========================================");
  console.log("  Running TranslateApp Service Tests     ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      process.stdout.write(`• ${name}... `);
      await fn();
      console.log("PASSED");
      passed++;
    } catch (err) {
      console.log("FAILED");
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  };

  // Test 1: Single text translation
  await test("translateText: English to Arabic", async () => {
    const res = await translateText({ text: "Hello, welcome to our application!", to: "ar" });
    assert.ok(res.translatedText, "Translated text should exist");
    assert.strictEqual(res.targetLang, "ar");
    assert.strictEqual(res.sourceLang, "en");
    console.log(`[Result: "${res.translatedText}"]`);
  });

  // Test 2: Single text translation with auto-detect
  await test("translateText: Arabic to English auto-detect", async () => {
    const res = await translateText({ text: "شكرا جزيلا لك", from: "auto", to: "en" });
    assert.ok(res.translatedText, "Translated text should exist");
    assert.strictEqual(res.targetLang, "en");
    assert.strictEqual(res.sourceLang, "ar");
    console.log(`[Result: "${res.translatedText}"]`);
  });

  // Test 3: Batch translation
  await test("batchTranslate: Multiple strings", async () => {
    const inputs = ["cat", "dog", "apple"];
    const results = await batchTranslate({ texts: inputs, from: "en", to: "es" });
    assert.strictEqual(results.length, 3, "Should return 3 translation objects");
    assert.ok(results[0].translatedText, "First translated text should exist");
    console.log(`[Result: ${results.map((r) => r.translatedText).join(", ")}]`);
  });

  // Test 4: Language detection
  await test("detectLanguage: French text", async () => {
    const res = await detectLanguage("Bonjour le monde, comment allez-vous?");
    assert.strictEqual(res.detectedLanguage, "fr", "Should detect French");
    console.log(`[Detected: ${res.languageName} (${res.detectedLanguage})]`);
  });

  // Test 5: Supported languages list
  await test("getSupportedLanguages: List is populated", () => {
    const langs = getSupportedLanguages();
    assert.ok(Array.isArray(langs) && langs.length > 50, "Should have more than 50 languages");
    const hasArabic = langs.some((l) => l.code === "ar");
    const hasEnglish = langs.some((l) => l.code === "en");
    assert.ok(hasArabic && hasEnglish, "Should contain ar and en");
    console.log(`[Total languages: ${langs.length}]`);
  });

  // Test 6: Dictionary lookup
  await test("getWordDetails: Dictionary lookup for 'book'", async () => {
    const details = await getWordDetails("book", "en");
    assert.ok(details, "Dictionary details should be returned");
    assert.ok(details.definition, "Should contain a definition");
    console.log(`[Definition: "${details.definition.slice(0, 45)}..."]`);
  });

  // Test 7: TTS Audio URL generation
  await test("getAudioUrl: Generate Google TTS URL", () => {
    const url = getAudioUrl({ text: "test audio", lang: "en" });
    assert.ok(url && url.startsWith("https://"), "Should return a valid HTTPS URL");
  });

  // Test 8: TTS Audio file caching
  await test("getCachedAudioFile: Download and cache MP3", async () => {
    const audioUrl = await getCachedAudioFile({ text: "test audio file", lang: "en" });
    assert.ok(audioUrl && audioUrl.startsWith("/audio/cache/"), "Should return relative audio path");
    const absolutePath = path.resolve(process.cwd(), audioUrl.replace(/^\//, ""));
    assert.ok(fs.existsSync(absolutePath), "Cached audio file must exist on disk");
    const stats = fs.statSync(absolutePath);
    assert.ok(stats.size > 0, "Cached audio file must not be empty");
    console.log(`[Cached at: ${audioUrl}, Size: ${stats.size} bytes]`);
  });

  console.log("\n-----------------------------------------");
  console.log(`  Tests completed: ${passed} passed, ${failed} failed`);
  console.log("-----------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
