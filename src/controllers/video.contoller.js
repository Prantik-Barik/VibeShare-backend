import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deletefromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        query, 
        sortBy, 
        sortType, 
        userId = req.user?._id } = req.query
    //TODO: get all videos based on query, sort, pagination

    const user = await User.findById({
        _id : userId,
    })
    
    if(!user) {
        throw new ApiError(400, "User not found")
    }

    const allVideos = await Video.aggregate([
        { 
            $match : {
                videoOwner : new mongoose.Types.ObjectId(userId),
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            }
        },
        {
            $sort : {
                [sortBy]: sortType,
            }
        },
        {
            $skip : (page - 1) * limit
        },
        {
            $limit : parseInt(limit)
        }
    ])

    Video.aggregatePaginate(allVideos,{
        page, 
        limit
    })
    . then((result) => {
        return res.status(200)
        .json( new ApiResponse(200, result, "All videos successfully fetched"))
    })
    .catch((err) => {
        throw new ApiError(500, "Something went wrong while getting all videos from user" || err.message)
    });
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    const ownerId = req?.user._id
    
    if(!title || title?.trim() === ""){
        throw new ApiError(400, "Title cannot be empty")
    }

    if(!description || description?.trim() === ""){
        throw new ApiError(400, "Description cannot be empty")
    }
    
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailFileLocalPath = req.files?.thumbnail?.[0].path;

    if(!videoFileLocalPath){
        throw new ApiError(400, "Video File Not Found");
    }

    if(!thumbnailFileLocalPath){
        throw new ApiError(400, "Thumbnail File Not Found");
    }

    //upload video file and thumbnail to cloudinary

    const uploadVideoFile = await uploadOnCloudinary(videoFileLocalPath)
    const uploadThumbnailFile = await uploadOnCloudinary(thumbnailFileLocalPath)

    if(!(uploadVideoFile || uploadThumbnailFile)){
        throw new ApiError(400, "Video or Thumbnail upload on Cloudinary Failed");
    }

    const video = await Video.create({
        videoFile:{
            public_id: uploadVideoFile?.public_id,
            url: uploadVideoFile?.url
        },
        thumbnail:{
            public_id: uploadThumbnailFile?.public_id,
            url: uploadThumbnailFile?.url
        },
        title,
        description,
        duration : uploadVideoFile.duration,
        isPublished,
        owner : ownerId,
    })

    const createdVideo = await Video.findById(video._id)

    if(!createdVideo){
        throw new ApiError(400, "Video NOT Created");
    }

    return res.status(201).json(
        new ApiResponse(200, createdVideo, "Video created successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video ID is not valid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video not Found!")
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        video,
        "Video Fetched successfully"
    ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description} = req.body
    const thumbnailFile = req.file?.path;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video ID not Valid");
    }

    if(!(thumbnailFile || !(!title || title?.trim() === "") || !(!description || description?.trim() === ""))){
        throw new ApiError(400, "Update Fields are Required")
    }

    // find video 
    const previousVideo = await Video.findOne(
        {
            _id: videoId
        }
    )

    if(!previousVideo){
        throw new ApiError(404, "Video Not Found")
    }


    let updateFields = {
        $set : {
            title : (title) ? title : previousVideo?.title,
            description : (description) ? description : previousVideo?.description,
        }
    }

    // if thumbnail provided delete the previous one and upload new on 

    if(thumbnailFile){
        await deletefromCloudinary(previousVideo.thumbnail?.public_id)

        // upload new one 
        const newThumbnail = await uploadOnCloudinary(thumbnailFile)
        
        if(!newThumbnail){
            throw new ApiError(500, "something went wrong while updating thumbnail on cloudinary !!")
        }

        updateFields.$set = {
            public_id: newThumbnail.public_id,
            url: newThumbnail.url
        }
    }

    //update the title and update the description
    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        updateFields,
        { 
            new : true
        }
    )

    //update the thumbnail
    
    if(!updatedVideo){
        throw new ApiError(400, "Something went wrong wile updating the video details")
    }

    return res.status(200)
    .json( new ApiResponse(200,updatedVideo, 
        "Video Details Updated!"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is not valid")
    }
    const video = await Video.findById({
        _id : videoId,
    })

    if(!video){
        throw new ApiError(400, "Video NOT found")
    }

    //delete video and tumbnail on cloudinary 
    if(video.videoFile){
        await deletefromCloudinary(video.videoFile.public_id)
    }

    if(video.thumbnail){
        await deletefromCloudinary(video.thumbnail.public_id)
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    if(!deleteVideo){
        throw new ApiError(400, "Something went wrong while deleting video")
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        deleteVideo,
        "Video deleted successfully"
    ))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video ID is not valid")
    }

    const video = Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video not Found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 
                "You don't have permission to toggle this video!")
    }

    video.isPublished = !video.isPublished

    await video.save({validateBeforeSave : false})

    return res.status(200)
    .json(200, video, "Video Status updated")
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}