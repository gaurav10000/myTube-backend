import { v2 as cloudinary} from "cloudinary"
import { log } from "console";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// cloudinary.v2.uploader.upload(
//     ``,
//     {public_id: },
//     function(error, result) {console.log(result);}
// )

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const response = cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        console.log(`file is uploaded on cloudinary ${response.url}`);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // removes the locally saved temporary file as the upload operation failed
        return null
    }
}

export { uploadOnCloudinary }