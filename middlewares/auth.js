import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";

/**
 * Protect routes - verifies JWT in Authorization header.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid Bearer token.",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_fallback_jwt_secret"
    );

    // If database is connected, verify user exists
    if (mongoose.connection.readyState === 1) {
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: "The user belonging to this token no longer exists.",
        });
      }

      req.user = currentUser;
      req.userId = currentUser._id;
    } else {
      // In standalone/mock mode without active DB
      req.userId = decoded.id;
      req.user = { _id: decoded.id, role: decoded.role || "user" };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token. Please log in again.",
    });
  }
};

/**
 * Restrict access to specified roles.
 * @param  {...string} roles - e.g. 'admin'
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to perform this action.",
      });
    }
    next();
  };
};
