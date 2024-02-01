import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video'

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Like.findOne({
        video : videoId,
        likedBy : req.user._id
    })

    // here code to remove like from video
    if(video){
        const unlikeVideo = await Like.findOneAndDelete({
            video: videoId,
            likedBy : req.user?._id
        })

        if(!unlikeVideo){
            throw new ApiError(400, "Something went wrong wile UN- Liking video")
        }
        
        return res.status(200)
        .json(new ApiResponse(200, 
            unlikeVideo, "Video Un-Liked Successfully"
        ))
    }
    //here code to add like to video
    else{
        
        const likedVideo = await Like.create({
            video: videoId,
            likedBy : req.user?._id
        })

        if(!likedVideo){
            throw new ApiError(400, "Something went wrong wile Liking video")
        }
        
        return res.status(200)
        .json(new ApiResponse(200, 
            likedVideo, "Video Liked Successfully"
        ))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID")
    }

    const comment = await Like.findOne({
        comment : commentId,
        likedBy : req.user._id
    })

    // here code to remove like from comment
    if(comment){
        const unlikeComment = await Like.findOneAndDelete({
            comment: commentId,
            likedBy : req.user?._id
        })

        if(!unlikeComment){
            throw new ApiError(400, "Something went wrong while unliking comment")
        }
        
        return res.status(200)
        .json(new ApiResponse(200, 
            unlikeVideo, "Comment UnLiked Successfully"
        ))
    }
    //here code to add like to comment
    else{
        
        const likedComment = await Like.create({
            comment: commentId,
            likedBy : req.user?._id
        })

        if(!likedComment){
            throw new ApiError(400, "Something went wrong wile Liking video")
        }
        
        return res.status(200)
        .json(new ApiResponse(200, 
            likedComment, "Comment Liked Successfully"
        ))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID")
    }

    const tweets = await Like.findOne({
        tweet : tweetId,
        likedBy : req.user._id
    })

    // here code to remove like from comment
    if(tweets){
        const unlikeTweet = await Like.findOneAndDelete({
            tweet: tweetId,
            likedBy : req.user?._id
        })

        if(!unlikeTweet){
            throw new ApiError(400, "Something went wrong while unliking tweet")
        }
        
        return res.status(200)
        .json(new ApiResponse(200, 
            unlikeComment, "Comment UnLiked Successfully"
        ))
    }
    //here code to add like to comment
    else{
        
        const likedTweet = await Like.create({
            tweet : tweetId,
            likedBy : req.user?._id
        })

        if(!likedTweet){
            throw new ApiError(400, "Something went wrong wile Liking tweet")
        }
        
        return res.status(200)
        .json(new ApiResponse(200, 
            likedTweet, "Tweet Liked Successfully"
        ))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "likedVideos",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField: "owner",
                            foreignField : "_id",
                            as: "videoOwner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            videoOwner : {
                                $arrayElemAt : ["$videoOwner", 0]
                            }
                        }
                    }
                ]
            }
        }
    ])
    
    return res.status(200)
    .json( new ApiResponse(
        200,
        likedVideos,
        "Liked Videos fetched successfully"
    ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}