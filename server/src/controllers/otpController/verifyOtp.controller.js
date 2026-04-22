import { Admin } from "../../models/admin.model.js";
import { hashOtp } from "../../utils/otp.js";
import { createToken } from "../../utils/adminAuth.js";

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ✅ Validate
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP required",
      });
    }

    // ✅ Ensure 6-digit numeric OTP
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: "OTP must be 6 digits",
      });
    }

    // ✅ Find user
    const admin = await Admin.findOne({
      email: email.toLowerCase(),
    }).select("+otp +is_active +shopify.shop_domain");

    if (!admin || !admin.otp || !admin.otp.code) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
      });
    }

    // 🚫 Too many attempts
    if (admin.otp.attempts >= 5) {
      return res.status(429).json({
        success: false,
        error: "Too many attempts. Request new OTP",
      });
    }

    // 🔐 Compare OTP
    const hashedOtp = hashOtp(otp);

    if (hashedOtp !== admin.otp.code) {
      admin.otp.attempts += 1;
      await admin.save();

      return res.status(401).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    // ⏱ Expiry check
    if (admin.otp.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: "OTP expired",
      });
    }

    // 🔐 Active check
    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        error: "Your account does not have an active subscription.",
        message: "No Active Subscription",
        code: "INACTIVE_SUBSCRIPTION",
        requires_action: true,
      });
    }

    // ✅ Get shop domain
    const shopDomain = admin.shop_domain ?? admin.shopify?.shop_domain ?? null;

    if (!shopDomain) {
      return res.status(400).json({
        success: false,
        error: "User not linked to any shop",
      });
    }

    // 🎟 Create token
    const token = createToken({
      admin_id: admin.admin_id,
      role: admin.role,
      shop_domain: shopDomain,
    });

    // 🧹 Clear OTP
    admin.otp = undefined;
    await admin.save();

    return res.json({
      success: true,
      token,
      admin: {
        admin_id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        shop_domain: shopDomain,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
