import mongoose from "mongoose";
import User from "../models/user.js";

/**
 * Seed initial admin user if configured and database is connected.
 */
const createAdminUser = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_USERNAME || "Administrator";

  if (!adminEmail || !adminPassword) {
    return;
  }

  try {
    const adminExists = await User.findOne({ email: adminEmail.toLowerCase() });

    if (!adminExists) {
      await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: "admin",
        isVerified: true,
      });
      console.log(`[Admin Seeder] Admin user created (${adminEmail})`);
    }
  } catch (err) {
    console.error("[Admin Seeder] Error seeding admin user:", err.message);
  }
};

export default createAdminUser;