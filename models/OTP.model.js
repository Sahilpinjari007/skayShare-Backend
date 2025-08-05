import mongoose from "mongoose";
const otpSchema = new mongoose.Schema({
  email: { type: String },
  otp: { type: String },
  expiresAt: Date,
});

export const otpModel = mongoose.model("OTP", otpSchema);
