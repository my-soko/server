import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminDeleteShop, createShop, deleteShop, getAllShops, getMyShops, getShopById, getUnverified, updateShop, verifyShop } from "../controllers/shop.controller.js";


const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", getAllShops);
router.get("/unverified", authMiddleware, getUnverified );
router.post("/", authMiddleware, upload.array("documents"), createShop);
router.get("/getMyShops", authMiddleware, getMyShops);
router.get("/:id", getShopById);
router.put("/:id", authMiddleware, upload.array("documents"), updateShop);
router.put("/verify/:id", authMiddleware, verifyShop);
router.delete("/:id", authMiddleware, deleteShop);
router.delete(
  "/admin/:id",
  authMiddleware,
  adminDeleteShop
);



export default router;
