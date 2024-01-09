import { v2 as cloudinary} from "cloudinary"
import { log } from "console";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            // public_id: localFilePath.split("/")[2].split(".")[0] // i will not send public name and let it make itself becasue two persons could send a file with same name, who knows? 
        })
        // file has been uploaded successfully
        // console.log(`file is uploaded on cloudinary ${response.url}`);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // removes the locally saved temporary file as the upload operation failed
        return null
    }
}

export { uploadOnCloudinary }