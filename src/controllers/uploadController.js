import cloudinary from "../config/cloudinary.js";


export const tempUploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products/temp" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        stream.end(fileBuffer);
      });
    };

    const uploadedUrls = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer))
    );

    res.json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Temp upload failed:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
};