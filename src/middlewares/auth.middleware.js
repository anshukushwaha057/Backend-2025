import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = async (req, _, next) => {
   try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") // Bearer <token>

      if (!token) {
         throw new ApiError(401, "Unauthorized Request")
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

      const user = await User.findById(decodedToken._id).select("-password -refreshToken")

      if (!user) {
         // NEXT_VIDEO: discuss about frontend
         throw new ApiError(401, "Invalid Access Token")
      }

      req.user = user
      next()
   } catch (error) {
      throw new ApiError(401, error.message || "Invalid access Token")
   }
}