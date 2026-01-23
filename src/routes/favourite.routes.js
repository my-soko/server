// routes/favourite.routes.js
import express from "express";
import { addToFavourite, getUserFavourites, removeFromFavourite } from "../controllers/favourite.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/", authMiddleware, addToFavourite);

router.delete("/:productId", authMiddleware, removeFromFavourite);

router.get("/", authMiddleware, getUserFavourites);

export default router;
