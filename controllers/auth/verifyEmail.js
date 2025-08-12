// packages
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";

//routers
const sendVerifyEmail = async (email, link) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Account Verification`,
      text: "Welcome",
      html: `
      <dev>
      <h3>Click to Verification: <a href=${link}>Verify</a></h3>
      <h4>if it was not you please ignore this message</h4>
      </dev>
      `,
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const activeEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "no token" });
    }
    const isVerify = jwt.verify(token, process.env.JWT_SECRET);
    if (!isVerify) {
      return res.status(400).json({ message: "not verify" });
    }
    const existingUser = await User.findById(isVerify.id);
    if (!existingUser) {
      return res
      .status(400)
      .json({ message: "the user with this email not found!" });
    }
    const code = isVerify.code;
    const id = isVerify.id;

    if (existingUser.verify === false) {
      if (existingUser.code === code) {
        await User.updateOne({ _id: id }, { $set: { verify: true } });
        return res.status(200).json({ message: "email verifyed" });
      } else {
        return res.status(400).json({ message: "wrong code" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "this email is already verifyed!" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { sendVerifyEmail, activeEmail };
