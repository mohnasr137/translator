import express from "express";
import {
  signUp,
  signIn,
  verifyEmail,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/verify/:token", verifyEmail);
router.post("/verify-code", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);

export default router;
