import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid ChannelId")
    }

    const channel = await User.findById({
        _id : channelId,
    })

    if(!channel){
        throw new ApiError(400, "This channel does not exist")
    }

    const isSubscribed = await Subscription.findOne({
        subsriber : req.user?._id,
        channel : channelId,
    })

    if(isSubscribed)
    {
        const unsubscribe = await Subscription.findOneAndDelete({
            subsriber : req.user?._id,
            channel : channelId,
        })

        if(!unsubscribe){
            throw new ApiError(400, "Something went wrong while deleting subscription")
        }

        return res.status(200).
        json( new ApiResponse(200, unsubscribe, "Unsubscribed successfully!"))
    }
    
    else
    {
        const subscribe = await Subscription.create({
            subsriber : req.user?._id,
            channel : channelId,
        })

        if(!subscribe){
            throw new ApiError(400, "Something went wrong while subscribing")
        }

        return res.status(200).
        json( new ApiResponse(200, subscribe, "Subscribed successfully!"))
    }
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id" )
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(channelId?.trim())
            }
        },
        {
            $lookup : {
               from :  "users",
               localField: "channel",
               foreignField: "_id",
               as : "subscribers"
            }
        },
        {
            $addFields : {
                subscriberCount : {
                    $size : "$subscribers"
                }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                avatar : 1,
                subscriberCount : 1,
            }
        }
    ])

    if(!subscriptions){
        throw new ApiError(500, "Something went wrong while fetching subscribers")
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        subscriptions[0],
        "subscriber list of a channel fetched successfully"
    ))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber Id" )
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(subscriberId?.trim())
            }
        },
        {
            $lookup : {
               from :  "users",
               localField: "subscriber",
               foreignField: "_id",
               as : "subscribedChannels"
            }
        },
        {
            $addFields : {
                channelCount : {
                    $size : "$subscribedChannels"
                }
            }
        },
        {
            $project : {

                fullName : 1,
                username : 1,
                avatar : 1,
                getSubscribedChannels : 1,
            }
        }
    ])

    console.log(subscriptions)

    if(!subscriptions){
        throw new ApiError(500, "Something went wrong while fetching subscribers")
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        subscriptions[0],
        "All subscribed channel fetched successfully"
    ))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}