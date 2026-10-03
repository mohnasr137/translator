import jwt from "jsonwebtoken";
import User from "../models/user.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/emailService.js";

const generateToken = (id, role = "user") => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || "default_fallback_jwt_secret",
    {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    }
  );
};

/**
 * Register a new user.
 * @route POST /api/v1/auth/signup
 */
export const signUp = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, password, and confirmPassword.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirmation password do not match.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "A user with this email address already exists.",
      });
    }

    // If existing unverified user, remove the unverified record
    if (existingUser && !existingUser.isVerified) {
      await User.deleteOne({ _id: existingUser._id });
    }

    const verificationCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : "",
      verificationCode,
      isVerified: false,
    });

    const verifyToken = jwt.sign(
      { id: user._id, code: verificationCode },
      process.env.JWT_SECRET || "default_fallback_jwt_secret",
      { expiresIn: "24h" }
    );

    const protocol = req.protocol;
    const host = req.get("host");
    const link = `${protocol}://${host}/api/v1/auth/verify/${verifyToken}`;

    await sendVerificationEmail(normalizedEmail, link, verificationCode);

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email with the code sent.",
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login.
 * @route POST /api/v1/auth/signin
 */
export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email via token or body code.
 * @route GET /api/v1/auth/verify/:token
 * @route POST /api/v1/auth/verify-code
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { email, code } = req.body || {};

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_fallback_jwt_secret"
      );
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (user.isVerified) {
        return res.status(200).json({
          success: true,
          message: "Email is already verified.",
        });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Email verified successfully. You can now log in.",
      });
    }

    if (email && code) {
      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User with this email not found.",
        });
      }

      if (user.isVerified) {
        return res.status(200).json({
          success: true,
          message: "Email is already verified.",
        });
      }

      if (user.verificationCode !== String(code).trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code.",
        });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Email verified successfully.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Please provide either a valid token or email and verification code.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset code.
 * @route POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address.",
      });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    user.resetPasswordCode = code;
    user.resetPasswordAllowed = false;
    await user.save();

    await sendPasswordResetEmail(normalizedEmail, code);

    return res.status(200).json({
      success: true,
      message: "Password reset code sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify reset code.
 * @route POST /api/v1/auth/verify-reset-code
 */
export const verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and reset code are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.resetPasswordCode !== String(code).trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset code.",
      });
    }

    user.resetPasswordAllowed = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Code verified successfully. You may now reset your password.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password.
 * @route POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and confirmPassword are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.resetPasswordAllowed) {
      return res.status(400).json({
        success: false,
        message: "Password reset has not been authorized. Please verify code first.",
      });
    }

    user.password = password;
    user.resetPasswordAllowed = false;
    user.resetPasswordCode = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user.
 * @route GET /api/v1/auth/me
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
};
