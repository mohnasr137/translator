// packages
import express from "express";

// imports
import { signUp, signIn } from "../controllers/auth/basicAuth.js";
import { activeEmail } from "../controllers/auth/verifyEmail.js";
import {
  resetPassCode,
  activeResetPass,
  resetPassword,
} from "../controllers/auth/resetPassword.js";

// init
const authRouter = express.Router();

// routers
authRouter.post("/signUp", signUp);
authRouter.post("/signIn", signIn);
authRouter.post("/resetPassCode", resetPassCode);
authRouter.post("/activeResetPass", activeResetPass);
authRouter.post("/resetPassword", resetPassword);
authRouter.get("/:token", activeEmail);

export default authRouter;
