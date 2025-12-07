// controllers/favourite.controller.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ADD TO FAVOURITES
export const addToFavourite = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    // Create favourite
    const favourite = await prisma.favourite.create({
      data: { userId, productId },
      include: {
        product: true,
      },
    });

    res.status(201).json({
      message: "Product added to favourites",
      favourite,
    });
  } catch (error) {
    // Handle duplicate favourite
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Product already in favourites",
      });
    }

    console.error("Error adding favourite:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// REMOVE FROM FAVOURITES
export const removeFromFavourite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const favourite = await prisma.favourite.findFirst({
      where: { userId, productId },
    });

    if (!favourite) {
      return res.status(404).json({ message: "Favourite not found" });
    }

    await prisma.favourite.delete({
      where: { id: favourite.id },
    });

    res.status(200).json({ message: "Favourite removed" });
  } catch (error) {
    console.error("Error removing favourite:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL USER FAVOURITES
export const getUserFavourites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favourites = await prisma.favourite.findMany({
      where: { userId },
      include: {
        product: true, // return full product details
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ favourites });
  } catch (error) {
    console.error("Error fetching favourites:", error);
    res.status(500).json({ message: "Server error" });
  }
};
