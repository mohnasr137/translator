import mongoose from "mongoose";

/**
 * Connect to MongoDB with timeout and graceful offline fallback.
 */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("[Database] MONGO_URI not configured. Skipping MongoDB connection.");
    return null;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(
      `[Database Warning] Could not connect to MongoDB: ${err.message}`
    );
    console.warn(
      "[Database Warning] Server will run with database features disabled. Translation & TTS endpoints remain fully functional."
    );
    return null;
  }
};

export default connectDB;