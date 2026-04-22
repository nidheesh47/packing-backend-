import { Admin } from "../../models/admin.model.js";
import { generateOtp, hashOtp } from "../../utils/otp.js";
import { sendOtpLoginEmail } from "../../services/email.service.js";

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ Validate
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // ✅ Find user
    const admin = await Admin.findOne({
      email: email.toLowerCase(),
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // 🔢 Generate OTP (string)
    const otp = generateOtp();

    console.log("GENERATED OTP:", otp); // 🔥 debug (remove in prod)

    // 🔐 Save hashed OTP
    admin.otp = {
      code: hashOtp(otp),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      attempts: 0,
    };

    await admin.save();

    // 📧 Send email
    await sendOtpLoginEmail(admin.email, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
