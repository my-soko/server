import axios from "axios";
import dotenv from "dotenv";
import prisma from "../config/prisma.js";

dotenv.config();

const {
  MPESA_SHORT_CODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
  MPESA_PROCESSING_URL,
  MPESA_CONSUMER_KEY,
  MPESA_SECRET_KEY,
} = process.env;

// Helper to generate STK password and timestamp
const generateSTKPassword = () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const password = Buffer.from(
    MPESA_SHORT_CODE + MPESA_PASSKEY + timestamp
  ).toString("base64");
  return { password, timestamp };
};

// Helper to get OAuth access token
const getAccessToken = async () => {
  try {
    const credentials = Buffer.from(
      `${MPESA_CONSUMER_KEY}:${MPESA_SECRET_KEY}`
    ).toString("base64");
    const response = await axios.get(
      `${MPESA_PROCESSING_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${credentials}` },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Failed to fetch access token:",
      error.response?.data || error.message
    );
    throw new Error("Access token request failed");
  }
};

export const initiatePayment = async (req, res) => {
  try {
    const { userId, phone, productData } = req.body;
    const cleanProductData = {
      title: productData.title,
      description: productData.description,
      category: productData.category,
      condition: productData.condition,
      brand: productData.brand,
      location: productData.location,
      warranty: productData.warranty || null,
      price: Number(productData.price),
      discountPrice: productData.discountPrice ? Number(productData.discountPrice) : null,
      whatsappNumber: productData.whatsappNumber,
      stockInCount: Number(productData.stockInCount) || 1,
      imageUrl: productData.imageUrl,
      imageUrls: Array.isArray(productData.imageUrls)
        ? productData.imageUrls
        : [],
    };

    if (!/^0[1-9]\d{8}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const effectivePrice =
      productData.discountPrice && productData.discountPrice > 0
        ? Number(productData.discountPrice)
        : Number(productData.price);

    if (!effectivePrice || effectivePrice <= 0) {
      return res.status(400).json({ message: "Invalid product price" });
    }

    const amount = Math.max(10, Math.ceil(effectivePrice * 0.01));
    // amount = 1;

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        status: "pending",
        pendingProductData: cleanProductData,
      },
    });

    const formattedPhone = `254${phone.slice(-9)}`;
    const { password, timestamp } = generateSTKPassword();
    const accessToken = await getAccessToken();

    const payload = {
      BusinessShortCode: MPESA_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: `Payment_${payment.id}`,
      TransactionDesc: "Product Posting Fee (1%)",
    };

    const { data } = await axios.post(
      `${MPESA_PROCESSING_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (data.ResponseCode !== "0") {
      return res.status(400).json({ message: data.ResponseDescription });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { checkoutRequestId: data.CheckoutRequestID },
    });

    res.json({
      paymentId: payment.id,
      checkoutRequestId: data.CheckoutRequestID,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const mpesaCallback = async (req, res) => {
  try {
    // Safely extract STK callback data
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) {
      console.log("Invalid callback: Missing stkCallback");
      return res.sendStatus(400);
    }

    const { ResultCode, CheckoutRequestID } = stkCallback;

    if (!CheckoutRequestID) {
      console.log("Invalid callback: Missing CheckoutRequestID");
      return res.sendStatus(400);
    }

    // Find the corresponding payment record
    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId: CheckoutRequestID },
    });

    if (!payment) {
      console.log(`Payment not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return res.sendStatus(404);
    }

    // Handle successful payment
    if (ResultCode === 0) {
      console.log(`Payment successful for payment ID: ${payment.id}`);

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "completed" },
      });

      // Create product automatically if pending data exists
      if (payment.pendingProductData) {
        const pending = payment.pendingProductData;

        // Extract image URLs safely
        const imageUrls = Array.isArray(pending.imageUrls) ? pending.imageUrls : [];

        const coverImage = imageUrls.length > 0 
          ? imageUrls[0] 
          : "https://via.placeholder.com/500x500.png?text=No+Image";

        const galleryImages = imageUrls.length > 1 ? imageUrls.slice(1) : [];

        try {
          await prisma.product.create({
            data: {
              title: pending.title || "Untitled Product",
              description: pending.description || "",
              price: Number(pending.price) || 0,
              category: pending.category || "UNCATEGORIZED",
              condition: pending.condition || "BRAND_NEW",
              brand: pending.brand || null,
              warranty: pending.warranty || null,
              discountPrice: pending.discountPrice ? Number(pending.discountPrice) : null,
              stockInCount: Number(pending.stockInCount) || 1,
              stockTotal: Number(pending.stockInCount) || 1,
              status: "onsale",
              quickSale: false,
              imageUrl: coverImage,
              images: galleryImages,
              seller: { connect: { id: payment.userId } },
            },
          });

          console.log(`Product created successfully for user ${payment.userId}`);
        } catch (productError) {
          console.error("Failed to create product after payment:", productError);
          // Don't fail the callback — payment was successful
        }
      }
    } else {
      // Payment failed or was cancelled
      console.log(`Payment failed for CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });
    }

    // Always respond with 200 to acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    console.error("Error in mpesaCallback:", error);
    // Still respond with 200 to prevent M-Pesa from retrying excessively
    res.sendStatus(200);
  }
};

// GET payment status
export const checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId },
    });

    if (!payment) {
      return res.status(404).json({ status: "not_found" });
    }

    return res.json({
      status: payment.status,
      paymentId: payment.id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// controllers/payment.controller.js
export const deletePaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    await prisma.payment.delete({ where: { id } });
    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePaymentStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status },
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
