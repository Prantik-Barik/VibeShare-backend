import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { ownerId }  = req.params

    if(!isValidObjectId(ownerId)){
        throw new ApiError(400, "Invalid OwnerId")
    }

    // Get total video views
    // Get total subscribers
    
    // Get total likes 

    const totalViews = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(ownerId)
            }
        },
        {
            
        }
    ])

    const totalSubscribers = await Video.aggregate

    // Get total videos
    const totalVideos = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(ownerId)
            }
        },
        {
            $count : "videos"
        }
    ])
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { ownerId } = req.params

    if(!isValidObjectId(ownerId)){
        throw new ApiError(404, "Invalid OwnerId")
    }

    const videos = await Video.find({
        owner : new mongoose.Types.ObjectId(ownerId),
    })

    if(!videos){
        throw new ApiError(500,"Something went wrong when getting videos")
    }

    return res.status(200)
    .json( new ApiResponse( 
        200, 
        videos, 
        "Channel Videos fetched Successfully"
    ))
})

export {
    getChannelStats, 
    getChannelVideos
    }