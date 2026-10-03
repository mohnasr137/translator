import express from "express";
import {
  translate,
  translateWord,
  batch,
  detect,
  getLanguages,
  getTTS,
  getSamples,
} from "../controllers/translateController.js";

const router = express.Router();

// Translation routes
router.post("/", translate);
router.post("/word", translateWord);
router.post("/batch", batch);
router.post("/detect", detect);
router.get("/languages", getLanguages);
router.get("/tts", getTTS);
router.get("/samples", getSamples);

export default router;
