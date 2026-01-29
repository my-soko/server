import express from "express";
import {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
} from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, upload.array("images", 6), createProduct);
router.put("/:id", authMiddleware, upload.array("images", 6), updateProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.delete("/:id", authMiddleware, deleteProduct);

export default router;
