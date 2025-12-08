import express from "express";
import { adminUpdateUser, deleteUser, fetchProfile, forgotPassword, getAllUsers, googleLogin, loginUser, logoutUser, registerUser, resetPassword, updateProfile, verifyEmail } from "../controllers/auth.controller.js";
import { adminOnly, authMiddleware } from "../middleware/auth.middleware.js";

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

router.get("/users", authMiddleware, adminOnly, getAllUsers);
router.put("/users/:id", authMiddleware, adminOnly, adminUpdateUser);
router.delete("/users/:id", authMiddleware, adminOnly, deleteUser);
export default router;