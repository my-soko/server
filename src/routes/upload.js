// routes/upload.js
import express from "express";
import multer from "multer";
import { tempUploadImages } from "../controllers/uploadController.js";

const router = express.Router();


const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post("/temp", upload.array("images", 10), tempUploadImages);

export default router;