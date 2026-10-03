import express from "express";
import {
  saveTranslation,
  getHistory,
  getFavorites,
  toggleFavorite,
  deleteTranslation,
  clearHistory,
} from "../controllers/historyController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// All history routes are protected
router.use(protect);

router.post("/", saveTranslation);
router.get("/", getHistory);
router.get("/favorites", getFavorites);
router.patch("/:id/favorite", toggleFavorite);
router.delete("/:id", deleteTranslation);
router.delete("/", clearHistory);

export default router;
