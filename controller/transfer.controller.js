import bcrypt from "bcrypt";

import {
  deleteFromCloudinary,
  uploadFilesToCloudinary,
} from "../services/upload.service.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { transferModel } from "../models/transfer.model.js";
import { sendEmail } from "../services/sendEmail.service.js";
import { sendFileDownloadLink } from "../view/EmailTampletes/sendFileDownloadLink.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { userModel } from "../models/user.model.js";
import { contactModel } from "../models/contact.model.js";
import { formatDate, getExpiryDate, getTransferSize } from "../utils/helper.js";

export const createTransfer = asyncHandler(async (req, res) => {
  const { action, emailTo, title, message, expireIn, password, filesMetaData } =
    req.body;
  const { email: emailFrom } = req?.user;

  if (!action || !emailFrom) {
    throw new ApiError(400, "Something went wrong");
  }
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "Please select file");
  }
  if (action === "sendEmail" && !emailTo) {
    throw new ApiError(400, "Please Enter Email to");
  }
  if (expireIn === "" && !expireIn) {
    throw new ApiError(400, "Please select expiry");
  }

  // 1) Upload files → Cloudinary
  const uploadedFiles = await uploadFilesToCloudinary(
    req.files,
    JSON.parse(filesMetaData),
    "skayshare/files"
  );

  // 2) Hash password if present
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

  // 3) Persist transfer
  const expireAt = getExpiryDate(expireIn);
  const transferDoc = await transferModel.create({
    files: uploadedFiles,
    action,
    emailTo,
    emailFrom,
    title,
    message,
    expireAt,
    password: hashedPassword,
  });

  // 4) Generate link (frontend/route can handle actual download)
  const link = `${process.env.APP_URL}/download/${transferDoc._id}`;

  // 5) Optional: email
  if (action === "sendEmail" && emailTo) {
    const existing = await contactModel.findOne({
      contactOwner: emailFrom,
      contactEmail: emailTo,
    });

    if (!existing) {
      let user = await userModel
        .findOne({ email: emailTo })
        .select("firstname lastname email");

      await contactModel.create({
        contactOwner: emailFrom,
        contactEmail: emailTo,
        firstname: user?.firstname || "",
        lastname: user?.lastname || "",
      });
    }
    const emailDetails = {
      emailFrom,
      title,
      items: req?.files.length,
      totalSize: getTransferSize(req?.files),
      expires: formatDate(getExpiryDate(expireIn)),
      link,
    };

    try {
      await sendEmail({
        from: emailFrom,
        to: emailTo,
        subject: `${emailFrom}, send file with you`,
        htmlTamplete: sendFileDownloadLink(emailDetails),
      });
    } catch (error) {
      throw new ApiError(500, "Unable to Send Email!...");
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { transferId: transferDoc._id },
        `File transferd successfuly!`
      )
    );
});

export const getTransferById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Something went wrong");

  const transfer = await transferModel.findById(id);
  if (!transfer)
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isTransferFeatchd: false }, `Transfer not found`)
      );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isTransferFeatchd: true, transfer },
        `Transfer file featchd`
      )
    );
});

export const getSentTranfers = asyncHandler(async (req, res) => {
  const { email } = req?.user;

  if (!email) throw new ApiError(400, "Something went wrong");

  const transfers = await transferModel.find({ emailFrom: email }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: transfers.length, transfers, isTransferFeatchd: true },
        `Sended Transfers featchd`
      )
    );
});

export const getRecivedTranfers = asyncHandler(async (req, res) => {
  const { email } = req?.user;

  if (!email) throw new ApiError(400, "Something went wrong");

  const transfers = await transferModel.find({ emailTo: email }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: transfers.length, transfers, isTransferFeatchd: true },
        `Recived Transfers featchd`
      )
    );
});

export const deleteTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transfer = await transferModel.findById(id);

  if (!transfer) {
    throw new ApiError(404, "Transfer not found");
  }

  for (const file of transfer.files) {
    if (file.public_id) {
      await deleteFromCloudinary(file.public_id);
    }
  }

  await transfer.deleteOne();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { transferDeleted: true, transferId: id },
        `Transfer deleted`
      )
    );
});

export const updateTransferPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!id) throw new ApiError(400, "Something went wrong");
  if (!password) throw new ApiError(400, "Password is required");

  if (password === -1) {
    const transfer = await transferModel.findByIdAndUpdate(
      id,
      {
        $unset: {
          password: 1, // it is remove refreshToken field from document
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isPassUpdate: true, transfer },
          `Password updated successfully`
        )
      );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const transfer = await transferModel.findByIdAndUpdate(
    id,
    { password: hashedPassword },
    { new: true }
  );

  if (!transfer) throw new ApiError(400, "Something went wrong");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPassUpdate: true, transfer },
        `Password updated successfully`
      )
    );
});

export const validateTransferPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!id) throw new ApiError(400, "Something went wrong");
  if (!password) throw new ApiError(400, "Password is required");

  const transfer = await transferModel.findById(id);
  if (!transfer) throw new ApiError(400, "Something went wrong");

  // if no password set
  if (!transfer.password) {
    return res
      .status(200)
      .json(new ApiResponse(200, { validated: true }, `No password required`));
  }

  const isMatch = await bcrypt.compare(password, transfer.password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid password");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { validated: true }, `Password matchd`));
});

export const searchTransfers = asyncHandler(async (req, res) => {
  const { q, action } = req.query;
  const { email } = req?.user;

  const transfers = await transferModel
    .find({
      [action]: email, // only transfers sent to me
      $or: [
        { title: { $regex: q, $options: "i" } },
        { emailFrom: { $regex: q, $options: "i" } },
        { "files.fileName": { $regex: q, $options: "i" } },
      ],
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isTransferFeatchd: true, transfers },
        `Transfers by query`
      )
    );
});
