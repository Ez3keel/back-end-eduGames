const { Router } = require("express")
const asyncHandler = require("../utils/asyncHandler")
const requireAuth = require("../middleware/authMiddleware")
const { getMe, updateProfile, changePassword } = require("../controllers/userController")

const router = Router()

router.use(requireAuth)
router.get("/me", asyncHandler(getMe))
router.patch("/me", asyncHandler(updateProfile))
router.patch("/me/password", asyncHandler(changePassword))

module.exports = router
