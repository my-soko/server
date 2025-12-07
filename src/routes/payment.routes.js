
import express from "express";
import { checkPaymentStatus, initiatePayment, mpesaCallback } from "../controllers/payment.controller.js";


const router = express.Router();

router.post("/initiate", initiatePayment);
router.post("/callback", mpesaCallback);
router.get("/status/:checkoutRequestId", checkPaymentStatus);  


export default router;
