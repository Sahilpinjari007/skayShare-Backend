import mongoose from "mongoose";

const fileItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // Cloudinary secure URL
    public_id: { type: String, required: true },
    fileName: { type: String, required: true },
    size: { type: Number, required: true }, // in bytes
    files: { type: Number }, // in bytes
    isFolder: { type: Boolean, default: false },
  },
  { _id: false }
);

const transferSchema = new mongoose.Schema(
  {
    files: { type: [fileItemSchema], validate: (v) => v && v.length > 0 },
    action: { type: String, enum: ["sendEmail", "createLink"], required: true },
    emailTo: { type: String }, // required if sendEmail
    emailFrom: { type: String, required: true },
    title: { type: String },
    message: { type: String },
    expireAt: { type: Date },
    password: { type: String }, // hashed if present
    isDownloaded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL index — MongoDB will delete docs automatically after expireAt
transferSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const transferModel = mongoose.model("Transfer", transferSchema);
