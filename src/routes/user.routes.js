import { Router } from "express"
import {changeCurrentPassword, getCurrentUser, getUserCurrentProfile, getWatchHistory, logOutUser, loginUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(
    loginUser
)

//secured routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(changeCurrentPassword)
router.route("/current-user").post(getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage)

//get from params with :
router.route("/c/:username").get(verifyJWT, getUserCurrentProfile)

router.route("/history").get(verifyJWT, getWatchHistory)



export default router