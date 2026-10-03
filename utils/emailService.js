import nodemailer from "nodemailer";

/**
 * Create a reusable transporter using environment credentials.
 */
const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });
};

/**
 * Send an email verification message.
 * @param {string} email
 * @param {string} link
 * @param {string} code
 * @returns {Promise<boolean>}
 */
export const sendVerificationEmail = async (email, link, code) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.warn(
        `[Email Service] GMAIL_USER/GMAIL_PASSWORD not set. Simulated verification email sent to ${email} with code: ${code}`
      );
      return true;
    }

    await transporter.sendMail({
      from: `"TranslateApp" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify Your TranslateApp Account",
      text: `Welcome! Your verification code is: ${code}. Or click here to verify: ${link}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #2563eb;">Welcome to TranslateApp!</h2>
          <p>Thank you for signing up. Please verify your email address to activate your account.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${code}</span>
          </div>
          <p style="text-align: center;">
            <a href="${link}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Verify Account</a>
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If you did not create this account, please ignore this email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("[Email Service] Verification email error:", error.message);
    return false;
  }
};

/**
 * Send a password reset code email.
 * @param {string} email
 * @param {string} code
 * @returns {Promise<boolean>}
 */
export const sendPasswordResetEmail = async (email, code) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.warn(
        `[Email Service] GMAIL_USER/GMAIL_PASSWORD not set. Simulated password reset email sent to ${email} with code: ${code}`
      );
      return true;
    }

    await transporter.sendMail({
      from: `"TranslateApp" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request - TranslateApp",
      text: `Your password reset code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the following 6-digit code to continue:</p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #dc2626;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("[Email Service] Password reset email error:", error.message);
    return false;
  }
};
