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
    
    const channelStats = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(ownerId)
            }
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as : "Likes"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "owner",
                foreignField : "channel",
                as : "Subscribers"
            }
        },
        {
            $group : {
                _id : null,
                totalVideos : { $count : "videos" },
                totalViews : { $sum : "$views" },
                totalSubscribers : { $first :
                    { $size : "$Subscribers" }},
                totalLikes : { $first :
                    { $size : "$Likes" }},
            },
        },
        {
            $project : {
                totalSubscribers:1,
                totalLikes:1,
                totalVideos:1,
                totalViews:1
            }
        }
    ])

    return res.status(200).json( new ApiResponse(
        200,
        channelStats[0],
        "ChannelStats fetched successfully"
    ))
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