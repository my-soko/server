// controllers/paymentController.js
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

// Initiate payment (STK Push)
export const initiatePayment = async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!/^0[1-9]\d{8}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const amount = 1;

    const payment = await prisma.payment.create({
      data: { userId, amount, status: "pending" },
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

// Mpesa Callback
export const mpesaCallback = async (req, res) => {
  try {
    const stk = req.body?.Body?.stkCallback;
    if (!stk) return res.sendStatus(400);

    const { ResultCode, CheckoutRequestID, CallbackMetadata } = stk;

    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId: CheckoutRequestID },
    });

    if (!payment) return res.sendStatus(404);

    if (ResultCode === 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "completed" },
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });
    }

    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
};
