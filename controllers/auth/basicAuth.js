// packages
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";
import { sendVerifyEmail } from "./verifyEmail.js";

// init
const url = process.env.API_URL;

// routers
const signUp = async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;
    if (!name || !phone || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    const image =
      req.protocol +
      "://" +
      req.get("host") +
      path.join(`${url}/portfolio`, "simple.jpg");

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "password and confirm password are not the same" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.verify === true) {
      return res
        .status(400)
        .json({ message: "the user with same email already exists!" });
    }
    if (existingUser && existingUser.verify === false) {
      await User.deleteOne({ email });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const user = await User.create({
      name,
      phone,
      email,
      password,
      code,
      image,
    });

    const token = jwt.sign(
      { id: user._id, code: code },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      }
    );
    const link =
      req.protocol + "://" + req.get("host") + `/api/v1/auth/${token}`;
    if (!sendVerifyEmail(email, link)) {
      return res
        .status(400)
        .json({ message: "send verification email failed, Please try again" });
    }

    return res.status(200).json({
      message: "user created and verification email send successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne(
      { email },
      { name: 1, phone: 1, email: 1, role: 1, image: 1, password: 1 }
    );
    if (!user) {
      return res
        .status(400)
        .json({ message: "the user with this email not found!" });
    }
    if (user.verify === false) {
      return res
        .status(400)
        .json({ message: "the user with this email not verifyed!" });
    }
    if (user.resetPass === true) {
      return res
        .status(400)
        .json({ message: "this email not activated to reset password!" });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
    res.status(200).json({
      message: "login successfully",
      token,
      user: {
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { signUp, signIn };
