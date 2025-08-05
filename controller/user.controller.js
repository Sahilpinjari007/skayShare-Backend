import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createRandomOTP } from "../services/OTPGenration.service.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/sendEmail.service.js";
import { sendOTP } from "../view/EmailTampletes/sendOTP.js";
import { otpModel } from "../models/OTP.model.js";
import crypto from "crypto";
import { resetPassword } from "../view/EmailTampletes/resetPassword.js";

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

  const existedUser = await userModel.findOne({ email });

  if (existedUser) {
    const OTP = createRandomOTP();
    const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
    const OTPExpiresAt = Date.now() + 1000 * 60 * 2;

    await otpModel.create({
      email,
      otp: hashedOtp,
      expiresAt: OTPExpiresAt,
    });

    const result = await sendEmail(email, `Your code is: ${OTP}`, sendOTP(OTP));

    if (!result?.success) {
      await userModel.deleteOne({ email });
      throw new ApiError(500, "Unable to Send Email!...");
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

  if (!password || password?.trim() === "") {
    throw new ApiError(400, "Password is required!");
  }

  if (password?.length < 6) throw new ApiError(404, "Password is to small!");

  const existedUser = await userModel.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with Email already Exists!");
  }

  await userModel.create({ email, password, isVerified: false });

  const OTP = createRandomOTP();
  const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
  const OTPExpiresAt = Date.now() + 1000 * 60 * 2;

  await otpModel.create({
    email,
    otp: hashedOtp,
    expiresAt: OTPExpiresAt,
  });

  const result = await sendEmail(email, `Your code is: ${OTP}`, sendOTP(OTP));

  if (!result?.success) {
    await userModel.deleteOne({ email });
    throw new ApiError(500, "Unable to Send Email!...");
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

  const existedUser = await userModel.findOne({ email });

  if (!existedUser) throw new ApiError(404, "User does not exist!");

  const OTP = createRandomOTP();
  const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
  const OTPExpiresAt = Date.now() + 1000 * 60 * 2;

  await otpModel.create({
    email,
    otp: hashedOtp,
    expiresAt: OTPExpiresAt,
  });

  const result = await sendEmail(email, `Your code is: ${OTP}`, sendOTP(OTP));

  if (!result?.success) {
    await userModel.deleteOne({ email });
    throw new ApiError(500, "Unable to Send Email!...");
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

export const resenOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email?.trim() === "") {
    throw new ApiError(400, "Something went Wrong!");
  }

  const existedUser = await userModel.findOne({ email });

  if (!existedUser) throw new ApiError(404, "Something went Wrong!");

  const otpRecord = await otpModel.findOne({ email });
  await otpRecord.deleteOne({ email });

  const OTP = createRandomOTP();
  const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
  const OTPExpiresAt = Date.now() + 1000 * 60 * 2;

  await otpModel.create({
    email,
    otp: hashedOtp,
    expiresAt: OTPExpiresAt,
  });

  const result = await sendEmail(email, `Your code is: ${OTP}`, sendOTP(OTP));

  if (!result?.success) {
    await userModel.deleteOne({ email });
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

  if (!OTP || OTP?.trim() === "") {
    throw new ApiError(400, "Please Enter OTP!");
  }

  const otpRecord = await otpModel.findOne({ email });
  if (!otpRecord || Date.now() > otpRecord.expiresAt)
    throw new Error("OTP Expired!");

  const hashedInputOtp = crypto.createHash("sha256").update(OTP).digest("hex");

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
    .json(new ApiResponse(200, {}, "user logged out!"));
});

export const reqResetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email?.trim() === "") {
    throw new ApiError(400, "Email is required!");
  }

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

  const result = await sendEmail(
    email,
    "Reset your password",
    resetPassword(resetURL)
  );

  if (!result?.success) {
    await userModel.deleteOne({ email });
    throw new ApiError(500, "Unable to Send Email!...");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { isLinkSend: true }, `Link send on email!`));
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { email, token, pass, confirmPass, isLogOutAll } = req.body;

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

  user.password = pass; // hash it first if needed
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
