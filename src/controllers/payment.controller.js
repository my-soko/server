// controllers/paymentController.js
import axios from "axios";
import dotenv from "dotenv";
import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
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

// Initiate payment (STK Push)
// controllers/paymentController.js
export const initiatePayment = async (req, res) => {
  try {
    const { userId, phone, productData } = req.body;

    // Convert productData strings to correct types
    const cleanProductData = {
      title: productData.title,
      description: productData.description,
      category: productData.category,
      condition: productData.condition,
      brand: productData.brand,
      location: productData.location,
      price: Number(productData.price), // FIX: convert string to number
      whatsappNumber: productData.whatsappNumber,
      imageUrl: productData.imageUrl, // if needed
    };

    if (!/^0[1-9]\d{8}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const amount = 1; // or from productData.price

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        status: "pending",
        pendingProductData: cleanProductData,
      },
    });

    console.log("PRODUCT DATA RECEIVED:", cleanProductData);

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
      TransactionDesc: "Product Posting Payment",
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

const uploadToCloudinary = (fileUrlOrBase64) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileUrlOrBase64,
      { folder: "products" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
  });
};

export const mpesaCallback = async (req, res) => {
  try {
    const stk = req.body?.Body?.stkCallback;
    if (!stk) return res.sendStatus(400);

    const { ResultCode, CheckoutRequestID } = stk;

    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId: CheckoutRequestID },
    });
    if (!payment) return res.sendStatus(404);

    if (ResultCode === 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "completed" },
      });

      // Create product automatically
      if (payment.pendingProductData) {
        await prisma.product.create({
          data: {
            title: payment.pendingProductData.title,
            description: payment.pendingProductData.description,
            price: Number(payment.pendingProductData.price),
            category: payment.pendingProductData.category,
            stockInCount: payment.pendingProductData.stockInCount,
            imageUrl:
              payment.pendingProductData.imageUrl || "default_image_url",
            seller: { connect: { id: payment.userId } },
            discountPrice: payment.pendingProductData.discountPrice
              ? Number(payment.pendingProductData.discountPrice)
              : null,
            status: "onsale",
            quickSale: false,
            images: payment.pendingProductData.images || [],
          },
        });
      }
    } else {
      // Only mark payment as completed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "completed" },
      });
    }

    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
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
