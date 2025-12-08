import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      brand,
      discountPrice,
      stockInCount,
      status,
      quickSale,
      condition,
    } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) return res.status(404).json({ message: "User not found" });

    // ADMIN BYPASS PAYMENT
    if (user.role !== "admin") {
      // Check if payment exists
      const payment = await prisma.payment.findFirst({
        where: { userId: user.id, status: "completed" },
      });

      if (!payment) {
        return res.status(403).json({
          message: "Payment required before posting a product",
        });
      }
    }

    if (!user.whatsappNumber) {
      return res.status(400).json({
        message:
          "Please update your profile with your WhatsApp number before posting a product.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Please upload at least one image." });
    }

    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(fileBuffer);
      });
    };

    // Then:
    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer))
    );

    const coverImage = uploadedImages[0];
    const images = uploadedImages.slice(1); // string array

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        brand,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stockInCount: parseInt(stockInCount),
        status: status || "onsale",
        quickSale: quickSale === "true",
        condition: condition || "BRAND_NEW",
        imageUrl: coverImage,
        images,
        seller: {
          connect: { id: user.id },
        },
      },
    });

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Only allow owner or admin
    if (product.sellerId !== req.user.id) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    const {
      title,
      description,
      price,
      category,
      brand,
      discountPrice,
      stockInCount,
      status,
      quickSale,
      condition,
    } = req.body;

    let imageUrl;
    let images = [];

    if (req.files && req.files.length > 0) {
      const uploadToCloudinary = (fileBuffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(fileBuffer);
        });

      const uploadedImages = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );

      imageUrl = uploadedImages[0];
      images = uploadedImages.slice(1);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        price: price ? parseFloat(price) : undefined,
        category,
        brand,
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        stockInCount: stockInCount ? parseInt(stockInCount) : undefined,
        status: status || undefined,
        quickSale: quickSale ? quickSale === "true" : undefined,
        condition: condition || undefined,
        ...(imageUrl && { imageUrl }),
        ...(images.length > 0 && { images }),
      },
    });

    res.json({ message: "Product updated", product: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        seller: {
          select: { fullName: true, email: true, whatsappNumber: true },
        },
        reviews: {
          select: { rating: true }, // Only ratings needed for average
        },
      },
    });

    const productsWithExtras = products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : 0;

      return {
        ...p,
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: p.reviews.length,
        whatsappLink: `https://wa.me/${
          p.seller.whatsappNumber
        }?text=${encodeURIComponent(
          `Hi, I'm interested in your product: ${p.title}\nDescription: ${p.description}\nPrice: $${p.price}\nImage: ${p.imageUrl}`
        )}`,
      };
    });

    res.json(productsWithExtras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: { fullName: true, email: true, whatsappNumber: true },
        },
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({
      ...product,
      sellerId: product.sellerId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// WhatsApp link for contacting seller
export const generateWhatsappLink = (product) => {
  const phone = product.seller.email; // ideally, store seller phone in User model
  const text = `Hi, I'm interested in your product: ${product.title}\nDescription: ${product.description}\nPrice: $${product.price}\nImage: ${product.imageUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};


export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Only allow owner or admin
    if (product.sellerId !== req.user.id) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: "Product deleted", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

