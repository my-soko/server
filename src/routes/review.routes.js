import express from "express";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { createReview, getProductReviews, getUserReview } from "../controllers/review.controller.js";

const router = express.Router();

// Only logged in users can create review
router.post("/", authMiddleware, createReview);

// Get all reviews for a product
router.get("/product/:productId", getProductReviews);

// Get logged-in user's review for a product
router.get("/product/:productId/user", authMiddleware, getUserReview);

export default router;
