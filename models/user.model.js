import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  avtarUrl: { type: String },
  email: {
    type: String,
    required: true,
    unique: true,
    lowecase: true,
    trim: true,
  },
  firstname: { type: String, trim: true },
  lastname: { type: String, trim: true },
  password: { type: String, required: true, trim: true },
  otp: { type: String },
  isVerified: { type: Boolean },
  isPro: { type: Boolean, default: false },
  plan: {
    planType: Object,
    isActive: { type: Boolean },
    startAt: { type: Date },
    expiresAt: { type: Date },
  },
  refreshToken: { type: String },
  resetPassToken: { token: { type: String }, tokenExpires: {type: Date} },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const userModel = mongoose.model("users", userSchema);
