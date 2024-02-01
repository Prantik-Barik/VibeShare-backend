import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    
    const {videoId} = req.params
    const {
        page = 1, 
        limit = 10
    } = req.query

    const videoComments = await Comment.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from:"users",
                localField: "owner",
                foreignField : "_id",
                as: "commentDetails",
                pipeline: [
                    {
                        $project : {
                            username : 1,
                            fullName : 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addField : {
                $first : "$commentDetails"
            }
        }
    ])

    Comment.aggregatePaginate(videoComments, {
        page,
        limit
    })
    .then( (results) => {
        return res.status(200)
        .json( new ApiResponse(200, results, "VideoComments Fetched Successfully"))
    })
    .catch((err) =>{
        throw new ApiError(500, "Something went wrong while fetching comments")
    })

})

const addComment = asyncHandler(async (req, res) => {
    
    // TODO: add a comment to a video
    
    try {
        const { content } = req.body;
        const { videoId } = req.params;
        const userId = req.user?._id;
    
        if(!content || content?.trim() === ""){
            throw new ApiError(400, "No Comment found")
        }
        
        const addComment = await Comment.create({
            content,
            owner : new mongoose.Types.ObjectId(userId),
            video : new mongoose.Types.ObjectId(videoId)
        });    

        if(!addComment)
        {
            throw new ApiError(500, "Something went wrong while adding comment ")
        }
    
        return res.status(200)
        .json( new ApiResponse(
            200,
            addComment,
            "Comment added successfully"
        ))
    } catch (error) {
        throw new ApiError(404, error.message || "Something went wrong")
    }

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    
    const { commentId } = req.params
    const { content } = req.body
    
    if(!isValidObjectId(commentId) || !commentId?.trim() === "")
    {
        throw new ApiError(400, "Invalid comment id")
    }

    if(!content)
    {
        throw new ApiError(404, "new comment not found")
    }
    
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found");
    }

    if(comment.owner.toString() != (req.user?._id).toString())
    {
        throw new ApiError(404, "Unauthorized User Access")
    }

    const updatedComment = await Comment.findByIdAndUpdate(        commentId,
        {
            $set: { content }
        },
        {
            new : true
        }
    )
    
    if(!updateComment)
    {
        throw new ApiError(400, "Error while updating comment")
    }

    return res.status(200)
    .json( new ApiResponse(200, updatedComment, "Comment Updated Successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    try {
        const { commentId } = req?.params;
    
        if(!(commentId || commentId?.trim() === ""))
        {
            throw new ApiError(
                400,
                "No such Comment found"
            )
        }
    
        const comment = await Comment.deleteOne({
            _id : commentId
        })
    
        if(!comment){
            new ApiError(400,"Error: Comment NOT deleted")
        }

        return res.status(200)
        .json( new ApiResponse(
            200,
            {comment},
            "Comment Deleted Successfully"
        ))

    } catch (error) {
        new ApiError(404, error.message || "Something went wrong while deleting comment")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}