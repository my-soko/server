import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";

export const createShop = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      description,
      businessType,
      registrationNo,
      taxPin,
      address,
      latitude,
      longitude,
      phone,
      email,
      website,
    } = req.body;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const documents = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "shops",
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );

          stream.end(file.buffer);
        });
        documents.push(url);
      }
    }

    const shop = await prisma.shop.create({
      data: {
        ownerId: userId,
        name,
        description,
        businessType,
        registrationNo,
        taxPin,
        address,
        latitude: lat,
        longitude: lng,
        phone,
        email,
        website,
        documents: { set: documents }, // store URLs
      },
    });

    res.status(201).json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create shop" });
  }
};

export const updateShop = async (req, res) => {
  try {
    const userId = req.user.id;
    const shopId = req.params.id;

    const {
      name,
      description,
      businessType,
      registrationNo,
      taxPin,
      address,
      latitude,
      longitude,
      phone,
      email,
      website,
    } = req.body;

    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;

    // Ensure shop exists
    const existingShop = await prisma.shop.findFirst({
      where: { id: shopId, ownerId: userId },
    });

    if (!existingShop)
      return res
        .status(404)
        .json({ message: "Shop not found or you are not authorized" });

    // Upload new documents to Cloudinary
    const documents = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "shops",
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );

          stream.end(file.buffer);
        });
        documents.push(url);
      }
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        name,
        description,
        businessType,
        registrationNo,
        taxPin,
        address,
        latitude: lat,
        longitude: lng,
        phone,
        email,
        website,
        documents: documents.length ? { set: documents } : undefined,
        updatedAt: new Date(),
      },
    });

    res.json(updatedShop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update shop" });
  }
};

export const getMyShops = async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { ownerId: req.user.id },
      include: { products: true },
    });

    res.json(shops);
  } catch {
    res.status(500).json({ message: "Failed to fetch shops" });
  }
};

export const getShopById = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: { products: true },
    });

    if (!shop) return res.status(404).json({ message: "Shop not found" });

    res.json(shop);
  } catch {
    res.status(500).json({ message: "Failed to fetch shop" });
  }
};

export const getAllShops = async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        products: true,
        owner: true, // Include owner so we can display name in admin panel
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(shops);
  } catch (error) {
    console.error("Fetch all shops error:", error);
    res.status(500).json({ message: "Failed to fetch shops" });
  }
};

// Get unverified shops
export const getUnverified = async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { isVerified: false },
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(shops);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch unverified shops" });
  }
};

// Verify a shop
export const verifyShop = async (req, res) => {
  try {
    const shopId = req.params.id;
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { isVerified: true },
    });
    res.json(shop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to verify shop" });
  }
};

export const deleteShop = async (req, res) => {
  try {
    const shopId = req.params.id;
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    await prisma.shop.delete({ where: { id: shopId } });

    res.json({ message: "Shop deleted successfully", id: shopId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete shop" });
  }
};

export const adminDeleteShop = async (req, res) => {
  try {
    const shopId = req.params.id;

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    await prisma.shop.delete({
      where: { id: shopId },
    });

    res.json({ id: shopId, message: "Shop deleted successfully" });
  } catch (error) {
    console.error("Admin delete error:", error);
    res.status(500).json({ message: "Failed to delete shop" });
  }
};
