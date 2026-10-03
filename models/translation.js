import mongoose from "mongoose";

const translationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalText: {
      type: String,
      required: [true, "Original text is required"],
      trim: true,
    },
    translatedText: {
      type: String,
      required: [true, "Translated text is required"],
      trim: true,
    },
    sourceLang: {
      type: String,
      default: "auto",
      trim: true,
    },
    targetLang: {
      type: String,
      required: [true, "Target language is required"],
      trim: true,
    },
    phonetic: {
      type: String,
      trim: true,
    },
    partOfSpeech: {
      type: String,
      trim: true,
    },
    definition: {
      type: String,
      trim: true,
    },
    exampleOriginal: {
      type: String,
      trim: true,
    },
    exampleTranslated: {
      type: String,
      trim: true,
    },
    audioOriginal: {
      type: String,
      trim: true,
    },
    audioTranslated: {
      type: String,
      trim: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Translation = mongoose.model("Translation", translationSchema);
export default Translation;
