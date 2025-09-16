import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createRandomOTP, validateEmail } from "../utils/helper.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/sendEmail.service.js";
import { sendOTP } from "../view/EmailTampletes/sendOTP.js";
import { otpModel } from "../models/OTP.model.js";
import crypto from "crypto";
import { resetPassword } from "../view/EmailTampletes/resetPassword.js";
import {
  deleteFromCloudinary,
  uploadFilesToCloudinary,
} from "../services/upload.service.js";
import { transferModel } from "../models/transfer.model.js";
import { contactModel } from "../models/contact.model.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await userModel.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);

    throw new ApiError(500, "Something went wrong!");
  }
};

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.body.refreshToken || req.cookies.refreshToken;

  if (!incomingRefreshToken)
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { isTokenRefreshd: false },
          "Refresh token missing!"
        )
      );

  try {
    // decode refresh token
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await userModel.findById(decodeToken._id);

    // check user
    if (!user) {
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { isTokenRefreshd: false },
            "Invalid refresh token!"
          )
        );
    }

    // check refresh token expird or not
    if (incomingRefreshToken !== user.refreshToken) {
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { isTokenRefreshd: false },
            "Refresh token is used or Expird!"
          )
        );
    }

    //send cookie
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { isTokenRefreshd: true, accessToken, refreshToken },
          "Access token refreshed!"
        )
      );
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          200,
          { isTokenRefreshd: false },
          "Invalid refresh token!"
        )
      );
  }
});

export const autoLogin = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: req.user,
        isLogdIn: true,
      },
      "login Successfuly!..."
    )
  );
});

export const checkIsExistingUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email?.trim() === "") {
    throw new ApiError(400, "Email is required!");
  }

  if (!validateEmail(email)) throw new ApiError(400, "Enter email correctly!");

  const existedUser = await userModel.findOne({ email });

  if (existedUser) {
    await otpModel.deleteMany({ email });

    const OTP = createRandomOTP();
    const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
    const OTPExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await otpModel.create({
      email,
      otp: hashedOtp,
      expiredAt: OTPExpiresAt,
    });

    try {
      await sendEmail({
        to: email,
        subject: `Your code is: ${OTP}`,
        htmlTamplete: sendOTP(OTP),
      });
    } catch (error) {
      throw new ApiError(500, "Unable to Send OTP!...");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isExistingUser: true, OTPExpiresAt },
          `OTP send on email!`
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { isExistingUser: false }, `Please Create New User!`)
    );
});

export const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || email?.trim() === "") {
    throw new ApiError(400, "Email is required!");
  }

  if (!validateEmail(email)) throw new ApiError(400, "Enter email correctly!");

  if (!password || password?.trim() === "") {
    throw new ApiError(400, "Password is required!");
  }

  if (password?.length < 6) throw new ApiError(404, "Password is to small!");

  const existedUser = await userModel.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with Email already Exists!");
  }

  await userModel.create({ email, password, isVerified: false });

  await otpModel.deleteMany({ email });

  const OTP = createRandomOTP();
  const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
  const OTPExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await otpModel.create({
    email,
    otp: hashedOtp,
    expiredAt: OTPExpiresAt,
  });

  try {
    await sendEmail({
      to: email,
      subject: `Your code is: ${OTP}`,
      htmlTamplete: sendOTP(OTP),
    });
  } catch (error) {
    await userModel.deleteOne({ email });
    throw new ApiError(500, "Unable to Send OTP!...");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isOTPSend: true, OTPExpiresAt },
        `OTP send on email`
      )
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email?.trim() === "") {
    throw new ApiError(400, "Email is required!");
  }

  if (!validateEmail(email)) throw new ApiError(400, "Enter email correctly!");

  const existedUser = await userModel.findOne({ email });

  if (!existedUser) throw new ApiError(404, "User does not exist!");

  await otpModel.deleteMany({ email });

  const OTP = createRandomOTP();
  const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
  const OTPExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await otpModel.create({
    email,
    otp: hashedOtp,
    expiredAt: OTPExpiresAt,
  });

  try {
    await sendEmail({
      to: email,
      subject: `Your code is: ${OTP}`,
      htmlTamplete: sendOTP(OTP),
    });
  } catch (error) {
    throw new ApiError(500, "Unable to Send OTP!...");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isOTPSend: true, OTPExpiresAt },
        `OTP send on email`
      )
    );
});

export const resentOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email?.trim() === "") {
    throw new ApiError(400, "Something went Wrong!");
  }

  if (!validateEmail(email)) throw new ApiError(400, "Enter email correctly!");

  const existedUser = await userModel.findOne({ email });

  if (!existedUser) throw new ApiError(404, "Something went Wrong!");

  await otpModel.deleteMany({ email });

  const OTP = createRandomOTP();
  const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
  const OTPExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await otpModel.create({
    email,
    otp: hashedOtp,
    expiredAt: OTPExpiresAt,
  });

  try {
    await sendEmail({
      to: email,
      subject: `Your code is: ${OTP}`,
      htmlTamplete: sendOTP(OTP),
    });
  } catch (error) {
    throw new ApiError(500, "Unable to Send OTP!...");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isOTPResend: true, OTPExpiresAt },
        `OTP send on email`
      )
    );
});

export const verfiyOTP = asyncHandler(async (req, res) => {
  const { email, OTP } = req.body;

  if (!email || email?.trim() === "") {
    throw new ApiError(400, "Something went Wrong!");
  }

  if (!validateEmail(email)) throw new ApiError(400, "Enter email correctly!");

  if (!OTP || OTP?.trim() === "") {
    throw new ApiError(400, "Please Enter OTP!");
  }

  const otpRecord = await otpModel.findOne({ email });
  if (!otpRecord || Date.now() > otpRecord?.expiredAt)
    throw new Error("OTP Expired!");

  const hashedInputOtp = crypto
    .createHash("sha256")
    .update(OTP.toUpperCase())
    .digest("hex");

  if (hashedInputOtp !== otpRecord.otp)
    throw new Error("Invalid OTP Try Agin!");

  await userModel.updateOne({ email }, { isVerified: true });
  await otpModel.deleteOne({ email });

  const user = await userModel
    .findOne({ email })
    .select("-password -refreshToken");

  const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
          isVerified: true,
          accessToken,
          refreshToken,
        },
        "login Successfuly!..."
      )
    );
});

export const logout = asyncHandler(async (req, res) => {
  await userModel.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // it is remove refreshToken field from document
      },
      isVerified: false,
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(
      new ApiResponse(200, { isLogdIn: false, user: null }, "user logged out!")
    );
});

export const reqResetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email?.trim() === "") {
    throw new ApiError(400, "Email is required!");
  }

  if (!validateEmail(email)) throw new ApiError(400, "Enter email correctly!");

  const user = await userModel.findOne({ email });
  if (!user) throw new ApiError(404, "User not found!");

  if (user.resetPassToken.tokenExpires > Date.now()) {
    throw new ApiError(404, "Wait 30m for new Link");
  }

  const resetToken = jwt.sign(
    { email: email },
    process.env.ACCESS_TOKEN_SECRET + process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "30m",
    }
  );

  user.resetPassToken = {
    token: resetToken,
    tokenExpires: Date.now() + 1000 * 60 * 30,
  };
  await user.save();

  const resetURL = `${process.env.CLIENT_AUTH_URL}/reset-password?token=${resetToken}&redirect_uri=${process.env.APP_URL}`;

  try {
    await sendEmail({
      to: email,
      subject: "Reset your password",
      htmlTamplete: resetPassword(resetURL),
    });
  } catch (error) {
    user.resetPassToken = undefined;
    await user.save();
    throw new ApiError(500, "Unable to Send Email!...");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { isLinkSend: true, user }, `Link send on email!`)
    );
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { email, token, pass, confirmPass, isLogOutAll } = req.body;

  if (!validateEmail(email)) throw new ApiError(400, "Enter email correctly!");
  const user = await userModel.findOne({ email });

  if (!user || !token || token == "")
    throw new ApiError(404, "Something went wrong!");

  if (!pass || pass == "") throw new ApiError(404, "Please Enter Password!");

  if (!confirmPass || confirmPass == "")
    throw new ApiError(404, "Please Enter Confirm Password!");

  if (pass !== confirmPass) return toast.error("Password dose not match!");

  if (pass?.length < 6) throw new ApiError(404, "Password is to small!");

  if (
    user.resetPassToken.token !== token ||
    user.resetPassToken.tokenExpires < Date.now()
  ) {
    throw new ApiError(400, "Link expired or Invalid!");
  }

  user.password = pass;
  if (isLogOutAll) {
    await userModel.findByIdAndUpdate(
      user._id,
      {
        $unset: {
          refreshToken: 1,
          resetPassToken: 1,
        },
        isVerified: false,
      },
      {
        new: true,
      }
    );

    await user.save();

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    return res
      .status(200)
      .clearCookie("refreshToken", options)
      .clearCookie("accessToken", options)
      .json(
        new ApiResponse(
          200,
          { isPassReset: true },
          "Password Changed Successfuly!"
        )
      );
  }

  await userModel.findByIdAndUpdate(
    user._id,
    {
      $unset: {
        resetPassToken: 1,
      },
    },
    {
      new: true,
    }
  );

  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPassReset: true },
        "Password Changed Successfuly!"
      )
    );
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const { _id } = req?.user;

  if (!req.file) {
    throw new ApiError(400, "Please select avatar");
  }

  const [uploaded] = await uploadFilesToCloudinary(
    [req.file],
    "skayshare/avatars"
  );

  if (!uploaded) {
    throw new ApiError(400, "Something wetn wrong");
  }

  const user = await userModel.findByIdAndUpdate(
    _id,
    { avatar: { url: uploaded?.url, publicId: uploaded?.public_id } },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAvatarUpload: true, user },
        "Avatar uploaded successfully"
      )
    );
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  const { _id } = req?.user;

  const user = await userModel.findById(_id);

  if (!user || !user.avatar) {
    throw new ApiError(400, "No avatar found");
  }

  if (user.avatar.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  const updatedUser = await userModel.findByIdAndUpdate(
    _id,
    {
      $unset: {
        avatar: 1,
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
        { isAvatarDeleted: true, user: updatedUser },
        "Avatar deleted successfully"
      )
    );
});

export const updateUserName = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { firstname, lastname } = req.body;

  if (!firstname && !lastname) {
    throw new ApiError(400, "Something went wrong!");
  }

  const updatedUser = await userModel
    .findByIdAndUpdate(
      userId,
      { $set: { firstname, lastname } },
      { new: true, runValidators: true }
    )
    .select("-password -refreshToken -otp -resetPassToken");

  if (!updatedUser) {
    throw new ApiError(400, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isUserUpdated: true, user: updatedUser },
        "User updated successfully"
      )
    );
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await transferModel.deleteMany({ emailFrom: req.user.email });
  await contactModel.deleteMany({ contactOwner: req.user.email });
  await otpModel.deleteMany({ email: req.user.email });
  await userModel.findByIdAndDelete(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAccountDeleted: true, user: null },
        "This account was deleted!"
      )
    );
});

