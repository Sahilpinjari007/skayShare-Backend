import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  contactOwner: { type: String, required: true },
  contactEmail: { type: String, required: true },
  firstname: { type: String },
  lastname: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// ek hi owner ke liye duplicate contactEmail avoid
contactSchema.index({ contactOwner: 1, contactEmail: 1 }, { unique: true });

export const contactModel = mongoose.model("Contact", contactSchema);
