import express from "express";
import {
  checkPaymentStatus,
  deletePaymentById,
  getAllPayments,
  initiatePayment,
  mpesaCallback,
  updatePaymentStatusById,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/initiate", initiatePayment);
router.post("/callback", mpesaCallback);
router.get("/status/:checkoutRequestId", checkPaymentStatus);
router.get("/", getAllPayments);
router.delete("/:id", deletePaymentById);
router.put("/:id", updatePaymentStatusById);


export default router;
