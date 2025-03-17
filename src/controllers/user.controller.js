import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOncloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
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
        throw new ApiError(500, "something went wrong while registering the user" )
    }

    console.log(createdUser)

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )


})


export { registerUser }