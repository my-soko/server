import prisma from "../config/prisma.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/email.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await hashPassword(password);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
      },
    });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const html = `<p>Verify your email:</p><a href="${verificationUrl}">${verificationUrl}</a>`;

    await sendEmail(email, "Verify your email", html);

    return res.json({
      success: true,
      message:
        "Registration successful. Check your email to verify your account.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // BLOCK user if not verified (JUST LIKE YOUR FIRST PROJECT)
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in or register your account if not registered.",
      });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsappNumber: true,
        profilePicture: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { whatsappNumber, profilePicture } = req.body;

    // Validate WhatsApp number format (start with country code)
    if (!whatsappNumber || !/^\+\d{7,15}$/.test(whatsappNumber)) {
      return res.status(400).json({
        message:
          "Invalid WhatsApp number. Include country code (e.g., +254712345678).",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { whatsappNumber, profilePicture },
    });

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour expiry

  // Save token in DB
  await prisma.user.update({
    where: { email },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  // Send reset email
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const message = `<p>Click the link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`;
  await sendEmail(user.email, "Password Reset Request", message);

  res.json({ message: "Password reset link sent to your email" });
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gte: new Date() },
    },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and remove token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  res.json({ message: "Password reset successfully" });
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      // Token not found — BUT maybe already verified?
      const alreadyVerified = await prisma.user.findFirst({
        where: { emailVerified: true, emailVerificationToken: null },
      });

      if (alreadyVerified) {
        return res.json({
          success: true,
          message: "Email already verified. You can log in.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return res.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
};

// GOOGLE LOGIN
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // If user doesn't exist, create a new user
      user = await prisma.user.create({
        data: {
          fullName: name,
          email,
          password: await hashPassword(crypto.randomBytes(16).toString("hex")), // random password
          profilePicture: picture || "",
          emailVerified: true, 
          role: "USER",
        },
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send token in cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    // Send user info including profile picture
    return res.json({
      success: true,
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || picture || "",
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profilePicture: true,
        whatsappNumber: true,
        emailVerified: true,
        createdAt: true
      }
    });

    return res.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, whatsappNumber } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: { fullName, email, role, whatsappNumber }
    });

    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error("Admin update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




// Logout User
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};
