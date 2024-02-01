import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) =>
{
    try {
        if(!localFilePath)  return null

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })

        // console.log("File is upload successfully",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)    //remove the locally saved temporary file as the upload

        return null;
    }
}

const deletefromCloudinary = async(publicId) =>{
    if(!publicId)
        return null
    
    try {
        return await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto"
        })
    } catch (error) {
        console.log("Something went wrong wile deleting on cloudinary")
    }    
}

export {
    uploadOnCloudinary,
    deletefromCloudinary
}