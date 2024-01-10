import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import fs from "fs"
import { decode } from "punycode";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId).select("-password")
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

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
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path // if we don't get coverimage then this will throw error, so we should not use this

    if ( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

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

const loginUser = asyncHandler( async (req, res) => {
    // req.body -> data
    // username -> email
    // find the user
    // password check
    // send cookie 

    const { email, username, password } = req.body
    if (!(username || email)) {
        throw new ApiError(400, " Either username or email is required to login")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    console.log(user);
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
            .status(200)
            .cookie("accessToken",accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    "User logged In Successfully",
                    {
                        user: loggedInUser, accessToken, refreshToken
                    }
                )
            )
    

})

const logoutUser = asyncHandler( async(req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
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

    return res
            .status(200)
            .clearCookie("refreshToken", options)
            .clearCookie("accessToken", options)
            .json(new ApiResponse(200, "User logged Out"), {})
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)
    
        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newrefreshToken, options)
                .json(
                    new ApiResponse(
                        200,
                        "Access token refreshed",
                        { accessToken, refreshToken: newrefreshToken }
                    )
                )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}