import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

import translateRoutes from "./routes/translateRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const apiUrl = process.env.API_URL || "/api/v1";

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Cross-Origin Resource Sharing
app.use(cors());

// Request logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting (100 requests per 15 mins per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use(limiter);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static audio files (cached TTS and sample audio)
const audioPath = path.resolve(__dirname, "audio");
app.use("/audio", express.static(audioPath));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TranslateApp API",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Welcome / Root info
app.get("/", (req, res) => {
  res.status(200).json({
    name: "TranslateApp API",
    version: "1.0.0",
    description: "Multilingual translation, dictionary lookup, text-to-speech synthesis, and history management API.",
    documentation: {
      health: "/health",
      apiBase: apiUrl,
      endpoints: {
        translate: `${apiUrl}/translate`,
        translateWord: `${apiUrl}/translate/word`,
        batchTranslate: `${apiUrl}/translate/batch`,
        detectLanguage: `${apiUrl}/translate/detect`,
        supportedLanguages: `${apiUrl}/translate/languages`,
        tts: `${apiUrl}/translate/tts?text=hello&lang=en`,
        samples: `${apiUrl}/translate/samples`,
        auth: `${apiUrl}/auth`,
        history: `${apiUrl}/history`,
      },
    },
  });
});

// Mount modular API routes
app.use(`${apiUrl}/translate`, translateRoutes);
app.use(`${apiUrl}/auth`, authRoutes);
app.use(`${apiUrl}/history`, historyRoutes);

// 404 Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

export default app;