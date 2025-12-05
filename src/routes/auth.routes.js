import express from "express";
import { fetchProfile, forgotPassword, googleLogin, loginUser, logoutUser, registerUser, resetPassword, updateProfile, verifyEmail } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profileInfo", authMiddleware, fetchProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/logout", authMiddleware, logoutUser );
router.post("/google-login", googleLogin);
export default router;