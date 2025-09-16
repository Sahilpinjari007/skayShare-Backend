import mongoose from "mongoose";
const otpSchema = new mongoose.Schema({
  email: { type: String },
  otp: { type: String },
  expiredAt: { type: Date, index: { expires: 0 } },
});

export const otpModel = mongoose.model("OTP", otpSchema);
