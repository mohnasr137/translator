import Translation from "../models/translation.js";

/**
 * Save a translation to user's history/favorites.
 * @route POST /api/v1/history
 */
export const saveTranslation = async (req, res, next) => {
  try {
    const {
      originalText,
      translatedText,
      sourceLang = "auto",
      targetLang,
      phonetic,
      partOfSpeech,
      definition,
      exampleOriginal,
      exampleTranslated,
      audioOriginal,
      audioTranslated,
      isFavorite = false,
    } = req.body;

    if (!originalText || !translatedText || !targetLang) {
      return res.status(400).json({
        success: false,
        message: "originalText, translatedText, and targetLang are required.",
      });
    }

    const translation = await Translation.create({
      userId: req.userId,
      originalText,
      translatedText,
      sourceLang,
      targetLang,
      phonetic,
      partOfSpeech,
      definition,
      exampleOriginal,
      exampleTranslated,
      audioOriginal,
      audioTranslated,
      isFavorite: Boolean(isFavorite),
    });

    return res.status(201).json({
      success: true,
      message: "Translation saved to history successfully.",
      data: translation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's translation history with pagination and search.
 * @route GET /api/v1/history
 */
export const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { search, targetLang } = req.query;

    const query = { userId: req.userId };

    if (search) {
      query.$or = [
        { originalText: { $regex: search, $options: "i" } },
        { translatedText: { $regex: search, $options: "i" } },
      ];
    }

    if (targetLang) {
      query.targetLang = targetLang.toLowerCase();
    }

    const [translations, total] = await Promise.all([
      Translation.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Translation.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: translations.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      data: translations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookmarked/favorite translations.
 * @route GET /api/v1/history/favorites
 */
export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Translation.find({
      userId: req.userId,
      isFavorite: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle favorite status of a translation.
 * @route PATCH /api/v1/history/:id/favorite
 */
export const toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;

    const translation = await Translation.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!translation) {
      return res.status(404).json({
        success: false,
        message: "Translation not found in your history.",
      });
    }

    translation.isFavorite = !translation.isFavorite;
    await translation.save();

    return res.status(200).json({
      success: true,
      message: `Translation ${translation.isFavorite ? "added to" : "removed from"} favorites.`,
      data: translation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a single translation from history.
 * @route DELETE /api/v1/history/:id
 */
export const deleteTranslation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await Translation.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Translation not found or already deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Translation deleted from history.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all translation history for the current user.
 * @route DELETE /api/v1/history
 */
export const clearHistory = async (req, res, next) => {
  try {
    const result = await Translation.deleteMany({ userId: req.userId });

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} items from your translation history.`,
    });
  } catch (error) {
    next(error);
  }
};
