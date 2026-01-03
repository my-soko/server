import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createShop, getAllShops, getMyShops, getShopById, updateShop } from "../controllers/shop.controller.js";


const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", getAllShops);
router.post("/", authMiddleware, upload.array("documents"), createShop);
router.get("/getMyShops", authMiddleware, getMyShops);
router.get("/:id", getShopById);
router.put("/:id", authMiddleware, upload.array("documents"), updateShop);


export default router;
