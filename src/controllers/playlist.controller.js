import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if((!name || name?.trim() === "") || (description && description.trim() === "")){
        throw new ApiError(400, "Name and description both are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        ownner : req.user?._id,
    })

    const createdPlaylist = await Playlist.findById(playlist._id)

    if(!createdPlaylist){
        throw new ApiError(400, "Something went wrong while creating playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, createdPlaylist,
        "Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(400, "User not found")
    }

    const playLists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos",
            }
        },
        {
            $addFields : {
                playlist: {
                    $first : "$videos"
                }
            }
        }
    ])

    if(!playLists){
        throw new ApiError( 500, "Something went wrong while fetching playlists")
    }

    return res.status(200).json( new ApiResponse(200,
        playLists,
        "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "PlayList not found")
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        playlist,
        "PlayList fetched successfully"
    ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const playlist = await Playlist.findById( playlistId )

    if(!playlist){
        throw new ApiError( 400, "No Playlist found with this ID")
    }

    //find req is sent by owner or not
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError( 401, "Unauthorized access to playlist denied")
    }
    
    const video = await Video.findById( videoId )
    if(!video){
        throw new ApiError(400, "No Video Found!")
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video already exists in playlist")
    }

    const addToPlayList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                video : videoId
            },
        },
        
        {
            new : true
        }
    )
    
    if(!addToPlayList){
        throw new ApiError( 500 , "Something went wrong while adding video to playlist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, addToPlayList, "Video added successfully to playlist")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const playlist = await Playlist.findById( playlistId )

    if(!playlist){
        throw new ApiError( 400, "No Playlist found with this ID")
    }

    //find req is sent by owner or not
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError( 401, "Unauthorized access to playlist denied")
    }
    
    const video = await Video.findById( videoId )
    if(!video){
        throw new ApiError(400, "No Video Found!")
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video already exists in playlist")
    }

    const removeFromPlayList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                video : videoId
            },
        },
        
        {
            new : true
        }
    )
    
    if(!removeFromPlayList){
        throw new ApiError( 500 , "Something went wrong while removing video from playlist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, removeFromPlayList, "Video removed successfully from playlist")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(403, "No playlist found!")
    }

    if(playlist.owner.toString() !== req.user._id){
        throw new ApiError(401, "Unauthorized to delete playlist")
    }

    const deleteList  = await Playlist.deleteOne({
        _id : playlistId,
    })

    if(!deleteList){
        throw new ApiError(500, "Something went wrong while deleting this playlist")
    }
    
    return res
    .status(200)
    .json( new ApiResponse( 
        200, 
        deleteList, 
        "PlayList Deleted Successfully"
    ))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    if((!name || name?.trim() === "") || (!description || description?.trim() === "")){
        throw new ApiError(400, "Name or description is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "No PlayList found")
    }

    //owner auth
    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401, "Unauthorized access to update playlist")
    }

    const updateList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set : {
                name,
                description,
            }
        },
        {
            new : true
        }
    )
    
    
    if(!updateList){
        throw new ApiError(500, "Something went wrong while updating playlist")
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        updateList,
        "PlayList Updated Successfully"
    ))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}