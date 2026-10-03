import app from "./app.js";
import connectDB from "./config/db.js";
import checkEnv from "./config/env.js";
import createAdminUser from "./utils/adminSeeder.js";

// Initialize and validate environment configuration
checkEnv();

// Attempt database connection
await connectDB();

// Attempt admin seeding (if DB is available and admin credentials are set)
await createAdminUser();

// Start HTTP Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `[Server] TranslateApp running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
  console.log(`[Server] Health check available at http://localhost:${PORT}/health`);
  console.log(`[Server] API endpoints available at http://localhost:${PORT}${process.env.API_URL || "/api/v1"}`);
});

// Process signal & rejection handling
process.on("unhandledRejection", (err) => {
  console.error(`[Process] Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error(`[Process] Uncaught Exception: ${err.message}`);
  server.close(() => process.exit(1));
});

const handleShutdown = (signal) => {
  console.log(`\n[Process] ${signal} received. Gracefully shutting down...`);
  server.close(() => {
    console.log("[Process] HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
