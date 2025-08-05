import { ApiError } from "../utils/ApiError.js"
import jwt from 'jsonwebtoken';
import { userModel } from "../models/user.model.js";
import asyncHandler from 'express-async-handler';

export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request!");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await userModel.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, 'Something went wrong!');
        }

        req.user = user;
        next();
    }
    catch (error) {
        throw new ApiError(401, error?.message || 'Something went wrong')
    }
})