import dotenv from "dotenv";
dotenv.config();

/**
 * Validate and set default environment variables.
 */
const checkEnv = () => {
  // Set defaults for common config
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  process.env.PORT = process.env.PORT || "5000";
  process.env.API_URL = process.env.API_URL || "/api/v1";
  process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "30d";

  if (!process.env.JWT_SECRET) {
    console.warn(
      "[Config] Warning: JWT_SECRET is not defined. Using fallback development secret."
    );
    process.env.JWT_SECRET = "translate_app_dev_secret_change_in_production";
  }

  if (!process.env.MONGO_URI) {
    console.warn(
      "[Config] Notice: MONGO_URI is not set. Database persistence will be disabled."
    );
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.info(
      "[Config] Info: Gmail credentials not configured. Verification & reset emails will be logged to console."
    );
  }
};

export default checkEnv;
