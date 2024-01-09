import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validate - not empty
    // check if user already exists: username. email
    // check for images, or avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { fullname, email, username, password } = req.body

    // if (fullname === "") {
    //     throw new ApiError(400, "Fullname is required")
    // }

    if (
        [fullname, email, username, password].some((field) => field?.trim() ==="")
    ) {
        throw new ApiError(400, "All fields are required!")
    }

    if (!email == undefined && email.indexOf("@") < 0) {
        throw new ApiError(400, "Email is not valid")
    }

    const existedUser = await  User.findOne({
        $or: [{ username }, { email }]
    })

    let coverImageLocalPath;
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path // if we don't get coverimage then this will throw error, so we should not use this

    if ( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if (existedUser) {
        fs.unlinkSync(avatarLocalPath)
        fs.unlinkSync(coverImageLocalPath)
        throw new ApiError(409, "User with same email or username already exists!")
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something wen wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            "User registered Successfully",
            createdUser,
        )
    )
})

export { 
    registerUser
}