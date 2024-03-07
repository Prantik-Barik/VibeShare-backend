import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    console.log(content)
    if(!content || content.trim() === ""){
        
        throw new ApiError(400, "Content is Required")
    }

    const newTweet = await Tweet.create({
        content,
        owner: req.user._id,
    })

    if(!newTweet){
        throw new ApiError(400, "Something went wrong while creating tweet")
    }
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError("Invalid User ID")
    }

    const user = await User.findById(userId)
    if(!user) {
        throw new ApiError(200, "User not found")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match : {
                owner : user._id,
            }
        }
    ])

    if(!userTweets){
        throw new ApiError(400, "Somwthing went wrong while fetching Tweets")
    }

    return res.status(200)
    .json( new ApiResponse( 200, userTweets, "Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { newContent } = req.body
    const { tweetId } = req.params

    if(!newContent || newContent?.trim()===""){
        throw new ApiError(400, "Content is Required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "This tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)
    
    if (!tweet) {
        throw new ApiError(400, "Tweet not found!");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this tweet!");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweet?._id,
        {
            $set : {
                content : newContent,
            }
        },
        {
            new : true
        }
    )

    if(!updatedTweet){
        throw new ApiError(400, "Something went while updating tweets")
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        updatedTweet, 
        "Tweet Updated Successfully!"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    const userId = req.user._id;

    if(!isValidObjectId( tweetId)){
        throw new ApiError(400, "Invalid Tweet ID")
    }

    const fetchTweet = await Tweet.findById(tweetId)

    if(!fetchTweet){
        throw new ApiError(400, "No Tweet found")
    }

    if (fetchTweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You don't have permission to delete this tweet!");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
        throw new ApiError(400, "Something went wrong while deleting")
    }

    return res.status(200)
    .json( new ApiResponse(200,
        deletedTweet,"Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}