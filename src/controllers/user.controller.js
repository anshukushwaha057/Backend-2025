import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOncloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import multer from "multer"

const generateAccessAndRefreshtokens = async (userID) => {

    try {
        const user = await User.findById(userID)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        // console.log(user)
        // console.log(user instanceof User);

        // if (typeof user.generateRefreshToken === "function") {
        //     console.log("✅ generateAccessToken exists!");
        // } else {
        //     console.log("❌ Method does not exist!");
        // }       

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken //updating refresh token in db
        await user.save({ validateBeforeSave: false }) // saving without password
        // console.log("\n accessToken --", accessToken,"\n refreshToken--", refreshToken)
        return { accessToken, refreshToken }

    } catch (error) {
        // console.error("omething went wrong while generating Access and Refresh Token")
        throw new ApiError(501, "Something went wrong while generating Access and Refresh Token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // steps to handle user Registration

    // get user details from frontend 
    // validate not empty
    // check if user already exist 
    // check for images, check for avatar 
    // upload on cloudinary - avatar
    // create user object - create entry in DB
    // remove password and refresh token from message
    // check for user creation 
    // send response

    const { username, email, fullName, password } = req.body

    // if(username===""){
    //     throw new ApiError(400, "fullname is Required")
    // }
    if ([username, email, fullName, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All field is Required")
    }

    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existUser) {
        throw new ApiError(409, "User Already Exist")
    }

    //multer middleware give more method like req.files

    const avatarLocalPath = req.files?.avatar[0]?.path
    // console.log( "multer", req.files)
    // console.log(avatarLocalPath)

    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required path")
    }

    const avatar = await uploadOncloudinary(avatarLocalPath)
    const coverImage = await uploadOncloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400, "avatar image is required")
    }


    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    })

    // select - bydefault all field are selected
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    console.log(createdUser)

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )


})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    const { username, email, password } = req.body
    // console.log(req.body)

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user not found")
    }

    // console.log(user)
    // console.log(user._id)

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid User Credential")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshtokens(user._id)
    // console.log(accessToken, refreshToken)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // console.log("Logged in user ",loggedInUser)

    // cookies // its can modify from only server 
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                // user: loggedInUser, accessToken, refreshToken,
                user: loggedInUser, accessToken, refreshToken, success: true,
            },
                "User LoggedIn Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user_id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, { success: true }, "User Logged Out")
        )
})

const renewAccessToken = asyncHandler(async (req, res) => {

    // const date = new Date().toLocaleTimeString()
    // console.log(`Header By postman ${date}`,req.cookies.refreshToken)

    const incomingRefereshToken = req.cookies.refreshToken

    // console.log("incoming ",incomingRefereshToken)

    if (!incomingRefereshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefereshToken, process.env.REFRESH_TOKEN_SECRET)

        console.log("decode value +++++++++++", decodedRefreshToken)

        const user = await User.findById(decodedRefreshToken._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        // console.log("user ++++++++++++++++",user)

        // console.log("",incomingRefereshToken)

        // console.log("from database token ",user)

        if (incomingRefereshToken != user.refreshToken) {
            throw new ApiError(401, "Refesh token is Expired or used")
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshtokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken, success: true },
                    "access Token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    const user = User.findById(req.user?._id)
    //TODO - user.isPassword check krna hai
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invailid old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(
            new ApiResponse(201, {}, "password changed successfully")
        )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user
    return res.status(200)
        .json(
            new ApiResponse(200, { user, success: true }, "current user fetch successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName,
            email
        }

    },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
        .json(
            200, { user, success: true }, "All details update successfully"
        )

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File Is Missing")
    }

    // TODO- delete old image on cloudinary
    const avatar = await uploadOncloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar on cloud")
    }

   const user =  await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image File Is Missing")
    }

    const coverImage = await uploadOncloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "error while uploading avatar on cloud")
    }

   const user =  await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage:coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "avatar updated successfully")
    )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    renewAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,

}