const { Router } = require("express")
const rateLimit = require("express-rate-limit")
const asyncHandler = require("../utils/asyncHandler")
const { register, login, refresh, logout, forgotPassword, resetPassword } = require("../controllers/authController")

const router = Router()

// Limita força-bruta em login/registro sem travar uso legítimo.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

// Mais restrito: evita spam de e-mails de redefinição.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

router.post("/register", authLimiter, asyncHandler(register))
router.post("/login", authLimiter, asyncHandler(login))
router.post("/refresh", asyncHandler(refresh))
router.post("/logout", logout)
router.post("/forgot-password", forgotPasswordLimiter, asyncHandler(forgotPassword))
router.post("/reset-password", authLimiter, asyncHandler(resetPassword))

module.exports = router
