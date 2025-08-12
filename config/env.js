import dotenv from "dotenv";
dotenv.config();

const checkEnv = () => {
  const env = [
    "NODE_ENV",
    "PORT",
    "API_URL",
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_EXPIRE",
    "ADMIN_USERNAME",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "GMAIL_USER",
    "GMAIL_PASSWORD",
  ];
  env.forEach((env) => {
    if (!process.env[env]) {
      console.error(`Please provide ${env} in the .env file`);
      process.exit(1);
    }
  });
};

export default checkEnv;
