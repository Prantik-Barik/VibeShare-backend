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

    // Get total likes 
    const totalLikes = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(ownerId)
            }
        },
        {
            $group : {
                _id : null,
                totalVideoLikes : {
                    $sum : {
                       $cond: [
                        { $ifNull : ["$video", false]},
                        1,
                        0
                       ] 
                    }
                },
                totalTweetLikes : {
                    $sum : {
                        $cond: [
                         { $ifNull : ["$tweet", false]},
                         1,
                         0
                        ] 
                     }
                },
                totalCommentLikes :{
                    $sum : {
                        $cond: [
                         { $ifNull : ["$commet", false]},
                         1,
                         0
                        ] 
                     }
                }
            }
        }
    ])

    // Get total video views
    const totalViews = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(ownerId)
            }
        },
        {
            $group : {
                _id : null,
                totalViews : {
                    $sum : "$views"
                }
            }
        }
    ])

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

    // Get total subscribers
    const totalSubscribers = await Video.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(ownerId)
            }
        },
        {
            $count : "subscribers"
        }
    ])

    const channelStats = {
        subscribers : totalSubscribers[0].subscribers,
        videos : totalVideos[0].videos,
        views : totalViews[0].totalViews,
    }

    return res.status(200).json( new ApiResponse(
        200,
        channelStats,
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