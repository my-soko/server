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
      warranty,
      discountPrice,
      stockInCount,
      status,
      quickSale,
      condition,
      imageUrls,
      productType,
      shopAddress,
      latitude,
      longitude,
    } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔒 Validate product type
    if (!["INDIVIDUAL", "SHOP"].includes(productType)) {
      return res.status(400).json({ message: "Invalid product type" });
    }

   if (productType === "SHOP") {
  if (latitude == null || longitude == null) {
    return res.status(400).json({
      message: "Shop location coordinates are required",
    });
  }
}

    if (user.role !== "admin") {
      const payment = await prisma.payment.findFirst({
        where: { userId: user.id, status: "completed" },
      });
      if (!payment) {
        return res
          .status(403)
          .json({ message: "Payment required before posting a product" });
      }
    }

    if (!user.whatsappNumber) {
      return res.status(400).json({
        message: "Please add WhatsApp number before posting a product",
      });
    }
    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls
      : imageUrls
      ? [imageUrls]
      : [];

    let finalImages = [...normalizedImageUrls];

    if (req.files?.length > 0) {
      const uploaded = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );
      finalImages.push(...uploaded);
    }

    if (!finalImages.length) {
      return res
        .status(400)
        .json({ message: "Please upload at least one image" });
    }

    const coverImage = finalImages[0];
    const galleryImages = finalImages.slice(1);

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
        warranty: warranty || null,
        status: status || "onsale",
        quickSale: Boolean(quickSale),
        condition: condition || "BRAND_NEW",
        productType,
        shopAddress: productType === "SHOP" ? shopAddress : null,
        latitude: productType === "SHOP" ? Number(latitude) : null,
        longitude: productType === "SHOP" ? Number(longitude) : null,
        imageUrl: coverImage,
        images: galleryImages,
        seller: { connect: { id: user.id } },
      },
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("[CREATE PRODUCT ERROR]", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const {
      title,
      description,
      category,
      brand,
      warranty,
      discountPrice,
      stockInCount,
      status,
      quickSale,
      condition,
      productType,
      shopAddress,
      latitude,
      longitude,
      removeImages,
    } = req.body;

    if (productType && !["INDIVIDUAL", "SHOP"].includes(productType)) {
      return res.status(400).json({ message: "Invalid product type" });
    }

    const finalProductType = productType || product.productType;

    if (finalProductType === "SHOP") {
      const lat = req.body.latitude ?? product.latitude;
      const lng = req.body.longitude ?? product.longitude;
      const address = shopAddress ?? product.shopAddress;

      if (!address || lat == null || lng == null) {
        return res.status(400).json({
          message: "Shop address and pinned location are required",
        });
      }
    }

    let finalGallery = product.images || [];
    let finalCover = product.imageUrl;

    const removeImagesArray = removeImages
      ? Array.isArray(removeImages)
        ? removeImages
        : JSON.parse(removeImages)
      : [];

    if (removeImagesArray.length > 0) {
      const deletePromises = removeImagesArray.map((url) => {
        const publicId = getPublicIdFromUrl(url);
        return publicId
          ? cloudinary.uploader.destroy(publicId, { invalidate: true })
          : Promise.resolve();
      });

      await Promise.all(deletePromises);

      finalGallery = finalGallery.filter(
        (img) => !removeImagesArray.includes(img)
      );

      if (removeImagesArray.includes(finalCover)) {
        finalCover = finalGallery[0] || null;
      }
    }

    if (req.files?.length > 0) {
      const uploadedUrls = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );

      finalGallery = [...finalGallery, ...uploadedUrls];

      if (!finalCover) {
        finalCover = uploadedUrls[0];
      }
    }

    if (!finalCover && finalGallery.length > 0) {
      finalCover = finalGallery[0];
    }

    if (!finalCover) {
      return res
        .status(400)
        .json({ message: "Product must have at least one image" });
    }
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: title?.trim() || undefined,
        description: description?.trim() || undefined,
        category: category || undefined,
        brand: brand || undefined,
        warranty: warranty ?? null,
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stockInCount: stockInCount ? parseInt(stockInCount, 10) : undefined,
        status: status || undefined,
        quickSale: quickSale === "true" || quickSale === true,
        condition: condition || undefined,
        productType: productType || undefined,
        shopAddress:
          finalProductType === "SHOP"
            ? shopAddress ?? product.shopAddress
            : null,
        latitude:
          finalProductType === "SHOP"
            ? latitude
              ? Number(latitude)
              : product.latitude
            : null,
        longitude:
          finalProductType === "SHOP"
            ? longitude
              ? Number(longitude)
              : product.longitude
            : null,
        imageUrl: finalCover,
        images: finalGallery,
      },
    });

    return res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("[UPDATE PRODUCT ERROR]", error);
    return res.status(500).json({ message: "Failed to update product" });
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
