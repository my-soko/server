import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import { calculateShopRating } from "../utils/shopRating.js";
import { validateColors } from "../utils/validateColors.js";

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

// Helper to validate colors

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
      colors,
      productType,
      shopId,
      imageUrls,
    } = req.body;

    const userId = req.user.id;

    if (!["INDIVIDUAL", "SHOP"].includes(productType)) {
      return res.status(400).json({ message: "Invalid product type" });
    }

    if (productType === "SHOP") {
      if (!shopId) return res.status(400).json({ message: "Shop is required" });

      const shop = await prisma.shop.findFirst({
        where: { id: shopId, ownerId: userId, isVerified: true },
      });
      if (!shop)
        return res
          .status(403)
          .json({ message: "Shop not found or not verified" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.whatsappNumber) {
      return res
        .status(400)
        .json({ message: "Add WhatsApp number before posting products" });
    }

    // Handle images
    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls
      : imageUrls
        ? [imageUrls]
        : [];
    let finalImages = [...normalizedImageUrls];

    if (req.files?.length) {
      const uploaded = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer)),
      );
      finalImages.push(...uploaded);
    }

    if (!finalImages.length)
      return res.status(400).json({ message: "At least one image required" });

    const [coverImage, ...galleryImages] = finalImages;

    const rawColors = req.body.colors ? JSON.parse(req.body.colors) : [];
    const validatedColors = validateColors(rawColors);

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
        colors: validatedColors,
        productType,
        shopId: productType === "SHOP" ? shopId : null,
        imageUrl: coverImage,
        images: galleryImages,
        sellerId: userId,
      },
    });

    res.status(201).json({ message: "Product created successfully", product });
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
      colors: colorsInput,
      productType,
      shopId,
      removeImages,
    } = req.body;

    const finalType = productType || product.productType;

    // Shop validation for SHOP
    if (finalType === "SHOP") {
      if (!shopId && !product.shopId)
        return res.status(400).json({ message: "Shop required" });

      const shop = await prisma.shop.findFirst({
        where: {
          id: shopId || product.shopId,
          ownerId: req.user.id,
          isVerified: true,
        },
      });
      if (!shop)
        return res
          .status(403)
          .json({ message: "Shop not found or not verified" });
    }

    // Images
    let finalGallery = product.images || [];
    let finalCover = product.imageUrl;

    const remove = Array.isArray(removeImages)
      ? removeImages
      : removeImages
        ? JSON.parse(removeImages)
        : [];

    if (remove.length) {
      await Promise.all(
        remove.map((url) => {
          const pid = getPublicIdFromUrl(url);
          return pid && cloudinary.uploader.destroy(pid);
        }),
      );
      finalGallery = finalGallery.filter((img) => !remove.includes(img));
      if (remove.includes(finalCover)) finalCover = finalGallery[0] || null;
    }

    // ✅ Prevent duplicate cover in gallery
    if (req.files?.length) {
      const uploaded = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer)),
      );

      if (!finalCover) {
        // Old cover was removed → first new image becomes cover, rest go to gallery
        finalCover = uploaded[0];
        finalGallery.push(...uploaded.slice(1));
      } else {
        // Normal add → all new images go to gallery, keep existing cover
        finalGallery.push(...uploaded);
      }
    }

    if (!finalCover)
      return res.status(400).json({ message: "Product needs an image" });

    // ✅ Properly handle colors input
    const rawColors =
      typeof colorsInput === "string"
        ? JSON.parse(colorsInput)
        : Array.isArray(colorsInput)
          ? colorsInput
          : [];
    const validatedColors = validateColors(rawColors);

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
        colors: validatedColors,
        quickSale: Boolean(quickSale),
        subItem,
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
    const {
      search,
      category,
      brand,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // 🔥 Dynamic filters
    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(category && { category }),
      ...(brand && { brand }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            select: {
              fullName: true,
              email: true,
              whatsappNumber: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithExtras = products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) /
            p.reviews.length
          : 0;

      return {
        ...p,
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: p.reviews.length,
        whatsappLink: `https://wa.me/${
          p.seller.whatsappNumber
        }?text=${encodeURIComponent(
          `Hi, I'm interested in your product: ${p.title}`
        )}`,
      };
    });

    res.json({
      products: productsWithExtras,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET PRODUCTS]", error);
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
        shop: {
          include: {
            products: {
              select: {
                id: true,
                reviews: {
                  select: { rating: true },
                },
              },
            },
          },
        },
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    let shopWithRating = null;

    if (product.shop) {
      const rating = calculateShopRating(product.shop);

      shopWithRating = {
        ...product.shop,
        averageRating: rating.averageRating,
        totalReviews: rating.totalReviews,
      };
      delete shopWithRating.products;
    }

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
        user?.role,
      );

      if (!user || user.role !== "admin") {
        console.log(
          `[DELETE] Unauthorized delete attempt by user ${req.user.id}`,
        );
        return res.status(403).json({ message: "Unauthorized" });
      }
    } else {
      console.log(`[DELETE] Owner deleting product ${id}: ${req.user.id}`);
    }

    await prisma.product.delete({ where: { id } });
    console.log(
      `[DELETE] Product ${id} deleted successfully by user ${req.user.id}`,
    );
    res.json({ message: "Product deleted", id });
  } catch (error) {
    console.error("[DELETE] Internal server error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
