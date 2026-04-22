import crypto from "crypto";

// ✅ Generate 6-digit numeric OTP (always string, keeps leading zeros)
export const generateOtp = (length = 6) => {
  let otp = "";
  const digits = "0123456789";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp; // e.g. "009366"
};

// ✅ Hash OTP
export const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
};
