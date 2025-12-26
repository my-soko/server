import prisma from "../config/prisma.js";

// CREATE REVIEW
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product." });
    }

 const review = await prisma.review.create({
  data: {
    rating,
    comment,
    userId,
    productId,
  },
  include: {
    user: {
      select: {
        fullName: true,
        profilePicture: true,
      },
    },
  },
});


    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// FETCH REVIEWS FOR A PRODUCT
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { fullName: true, profilePicture: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// FETCH SINGLE USER REVIEW FOR A PRODUCT (to disable frontend input if already reviewed)
export const getUserReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const review = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    res.json({ review });
  } catch (error) {
    console.error("Get user review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
