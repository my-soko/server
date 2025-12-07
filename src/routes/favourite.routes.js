// routes/favourite.routes.js
import express from "express";
import { addToFavourite, getUserFavourites, removeFromFavourite } from "../controllers/favourite.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();


// Add a product to favourites
router.post("/", authMiddleware, addToFavourite);

// Remove a favourite by productId
router.delete("/:productId", authMiddleware, removeFromFavourite);

// Get all favourites of logged-in user
router.get("/", authMiddleware, getUserFavourites);

export default router;
