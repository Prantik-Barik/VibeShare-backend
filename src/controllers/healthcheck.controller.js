import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const healthCheck = asyncHandler( async (req, res) => {
    try {
        return res
        .status(200)
        .json( new ApiResponse(
            200,
            {},
            "This is a successful healthcheck"
        ))
    } catch (error) {
        return res
        .status(400)
        .json( new ApiError(
            400,
            {},
            error.message || "Error while healthcheck"
        ))
    }
})

export { healthCheck }