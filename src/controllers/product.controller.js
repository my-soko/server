import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = (fileBuffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "products" }, (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      })
      .end(fileBuffer);
  });

const getPublicIdFromUrl = (url) => {
  const parts = url.split("/upload/");
  if (parts.length < 2) return "";
  const afterUpload = parts[1];
  const versionEndIndex = afterUpload.indexOf("/");
  if (versionEndIndex === -1) return "";
  return afterUpload.substring(versionEndIndex + 1).replace(/\.[^.]+$/, ""); // remove extension
};

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      brand,
      subItem,
      warranty,
      discountPrice,
      stockInCount,
      status,
      quickSale,
      condition,
      productType,
      shopId,
      imageUrls,
    } = req.body;

    const userId = req.user.id;

    // 🔒 Validate product type
    if (!["INDIVIDUAL", "SHOP"].includes(productType)) {
      return res.status(400).json({ message: "Invalid product type" });
    }

    // 🔐 SHOP product must belong to user's shop
    if (productType === "SHOP") {
      if (!shopId) {
        return res.status(400).json({ message: "Shop is required" });
      }

      const shop = await prisma.shop.findFirst({
        where: {
          id: shopId,
          ownerId: userId,
          isVerified: true,
        },
      });

      if (!shop) {
        return res.status(403).json({
          message: "Shop not found or not verified",
        });
      }
    }

    // WhatsApp check
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.whatsappNumber) {
      return res.status(400).json({
        message: "Add WhatsApp number before posting products",
      });
    }

    // Images
    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls
      : imageUrls
      ? [imageUrls]
      : [];

    let finalImages = [...normalizedImageUrls];

    if (req.files?.length) {
      const uploaded = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );
      finalImages.push(...uploaded);
    }

    if (!finalImages.length) {
      return res.status(400).json({ message: "At least one image required" });
    }

    const [coverImage, ...galleryImages] = finalImages;

    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stockInCount: Number(stockInCount),
        stockTotal: Number(stockInCount),
        category,
        brand,
        subItem,
        warranty,
        status: status || "onsale",
        quickSale: Boolean(quickSale),
        condition,
        productType,
        shopId: productType === "SHOP" ? shopId : null,
        imageUrl: coverImage,
        images: galleryImages,
        sellerId: userId,
      },
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("[CREATE PRODUCT]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.sellerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const {
      title,
      description,
      category,
      brand,
      subItem,
      warranty,
      discountPrice,
      stockInCount,
      status,
      quickSale,
      condition,
      productType,
      shopId,
      removeImages,
    } = req.body;

    if (productType && !["INDIVIDUAL", "SHOP"].includes(productType)) {
      return res.status(400).json({ message: "Invalid product type" });
    }

    const finalType = productType || product.productType;

    // 🔐 Validate shop ownership if SHOP
    if (finalType === "SHOP") {
      if (!shopId && !product.shopId) {
        return res.status(400).json({ message: "Shop required" });
      }

      const shop = await prisma.shop.findFirst({
        where: {
          id: shopId || product.shopId,
          ownerId: req.user.id,
          isVerified: true,
        },
      });

      if (!shop) {
        return res.status(403).json({
          message: "Shop not found or not verified",
        });
      }
    }

    // 🔄 Image handling (unchanged logic)
    let finalGallery = product.images || [];
    let finalCover = product.imageUrl;

    const remove = removeImages
      ? Array.isArray(removeImages)
        ? removeImages
        : JSON.parse(removeImages)
      : [];

    if (remove.length) {
      await Promise.all(
        remove.map((url) => {
          const pid = getPublicIdFromUrl(url);
          return pid && cloudinary.uploader.destroy(pid);
        })
      );

      finalGallery = finalGallery.filter((img) => !remove.includes(img));
      if (remove.includes(finalCover)) {
        finalCover = finalGallery[0] || null;
      }
    }

    if (req.files?.length) {
      const uploaded = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );
      finalGallery.push(...uploaded);
      if (!finalCover) finalCover = uploaded[0];
    }

    if (!finalCover) {
      return res.status(400).json({ message: "Product needs an image" });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim(),
        category,
        brand,
        warranty,
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stockInCount: stockInCount ? Number(stockInCount) : undefined,
        status,
        condition,
        productType: finalType,
        shop:
          finalType === "SHOP" && shopId
            ? { connect: { id: shopId } }
            : undefined,
        imageUrl: finalCover,
        images: finalGallery,
      },
    });

    res.json({ message: "Product updated", product: updated });
  } catch (error) {
    console.error("[UPDATE PRODUCT]", error);
    res.status(500).json({ message: "Failed to update product" });
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
          select: { rating: true },
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

export const generateWhatsappLink = (product) => {
  const phone = product.seller.email;
  const text = `Hi, I'm interested in your product: ${product.title}\nDescription: ${product.description}\nPrice: $${product.price}\nImage: ${product.imageUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      console.log(`[DELETE] Product not found: ${id}`);
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.imageUrl) {
      const coverId = getPublicIdFromUrl(product.imageUrl);
      if (coverId)
        await cloudinary.uploader.destroy(coverId, { invalidate: true });
    }

    if (product.images?.length > 0) {
      const galleryDeletes = product.images.map((url) => {
        const pid = getPublicIdFromUrl(url);
        return pid
          ? cloudinary.uploader.destroy(pid, { invalidate: true })
          : null;
      });
      await Promise.all(galleryDeletes.filter(Boolean));
    }

    // Only allow owner or admin
    if (product.sellerId !== req.user.id) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      console.log(
        `[DELETE] User trying to delete product ${id}:`,
        user ? user.id : "Not found",
        "Role:",
        user?.role
      );

      if (!user || user.role !== "admin") {
        console.log(
          `[DELETE] Unauthorized delete attempt by user ${req.user.id}`
        );
        return res.status(403).json({ message: "Unauthorized" });
      }
    } else {
      console.log(`[DELETE] Owner deleting product ${id}: ${req.user.id}`);
    }

    await prisma.product.delete({ where: { id } });
    console.log(
      `[DELETE] Product ${id} deleted successfully by user ${req.user.id}`
    );
    res.json({ message: "Product deleted", id });
  } catch (error) {
    console.error("[DELETE] Internal server error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
