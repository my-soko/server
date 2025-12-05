// routes/paymentRoutes.ts
import express from "express";
import { initiatePayment, mpesaCallback } from "../controllers/payment.controller.js";

const router = express.Router();

// STK Push initiation
router.post("/initiate", initiatePayment);

// Mpesa callback endpoint
router.post("/callback", mpesaCallback);

export default router;
