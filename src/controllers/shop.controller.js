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
        cloudinary.uploader.upload_stream(
              { resource_type: "auto", folder: "shops" },
              (error, result) => {
                  if (error) throw error;
                  documents.push(result.secure_url);
              }
          );
        // Use a promise wrapper for upload_stream
        await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "shops" },
            (error, result) => {
              if (error) reject(error);
              else {
                documents.push(result.secure_url);
                resolve(result);
              }
            }
          );
          stream.end(file.buffer);
        });
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
    const newDocuments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "shops" },
            (error, result) => {
              if (error) reject(error);
              else {
                newDocuments.push(result.secure_url);
                resolve(result);
              }
            }
          );
          stream.end(file.buffer);
        });
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
        documents: newDocuments.length ? { set: newDocuments } : undefined, // only update if new files uploaded
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
      where: {
        isVerified: true, 
      },
      include: {
        products: true, 
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

