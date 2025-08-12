// imports
import app from "./app.js";
import connectDB from "./config/db.js";
// import createAdminUser from './utils/adminSeeder.js';
import checkEnv from "./config/env.js";

// Configs
checkEnv();
await connectDB();
// await createAdminUser();

// Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Rejections
process.on("unhandledRejection", (err) => {
  console.error(`unhandledRejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error(`uncaughtException: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on("SIGINT", () => {
  console.log("Server is shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("Server is shutting down...");
  server.close(() => process.exit(0));
});
