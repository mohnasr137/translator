// modules
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// imports
import authRoutes from './routers/authRouters.js';
import homeRouters from "./routers/homeRouters.js";
import portfoiloRouters from "./routers/portfoiloRouters.js";
import userRouters from "./routers/user.js";

const app = express();
const url = process.env.API_URL;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(helmet());
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(
  `${url}/uploads`,
  express.static(path.join(__dirname, "images", "uploads"))
);
app.use(
  `${url}/portfolio`,
  express.static(path.join(__dirname, "images", "portfolio"))
);

// routes
app.use(`${url}/auth`, authRoutes);
app.use(`${url}/home`, homeRouters);
app.use(`${url}/portfoilo`, portfoiloRouters);
app.use(`${url}/user`, userRouters);

app.use(`/:error`, (req, res) => {
  const { error } = req.params;
  res.status(404).json({ error: `Error: you write ${error} and there is no api like this` });
});

app.use("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Ecommerce API" });
});

export default app;