import express from "express";
import { sendOtp } from "../../../controllers/otpController/sendOtp.controller.js";
import { verifyOtp } from "../../../controllers/otpController/verifyOtp.controller.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
