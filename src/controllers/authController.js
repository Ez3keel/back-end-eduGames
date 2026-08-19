const crypto = require("crypto")
const User = require("../models/User")
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
} = require("../utils/tokens")
const { sendPasswordResetEmail } = require("../utils/mailer")
const { isPasswordValid, PASSWORD_REQUIREMENTS_MESSAGE } = require("../utils/validatePassword")

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

async function issueSession(res, user) {
  const accessToken = signAccessToken(user._id.toString())
  const refreshToken = signRefreshToken(user._id.toString())
  setRefreshCookie(res, refreshToken)
  return accessToken
}

async function register(req, res) {
  const { name, username, email, password } = req.body

  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: "Preencha todos os campos." })
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "E-mail inválido." })
  }
  if (username.length < 3) {
    return res.status(400).json({ message: "O nome de usuário deve ter pelo menos 3 caracteres." })
  }
  if (!isPasswordValid(password)) {
    return res.status(400).json({ message: PASSWORD_REQUIREMENTS_MESSAGE })
  }

  const [existingUsername, existingEmail] = await Promise.all([
    User.findOne({ username: username.toLowerCase().trim() }),
    User.findByEmail(email),
  ])
  if (existingUsername || existingEmail) {
    return res.status(409).json({ message: "Nome de usuário ou e-mail já cadastrado." })
  }

  const user = new User({ username: username.toLowerCase().trim() })
  user.setName(name)
  user.setEmail(email)
  await user.setPassword(password)
  await user.save()

  const accessToken = await issueSession(res, user)
  return res.status(201).json({ accessToken, user: user.toProfileJSON() })
}

async function login(req, res) {
  const { usernameOrEmail, password } = req.body
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: "Informe usuário/e-mail e senha." })
  }

  const identifier = usernameOrEmail.toLowerCase().trim()
  const user = (await User.findOne({ username: identifier })) || (await User.findByEmail(identifier))

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Usuário ou senha inválidos." })
  }

  const accessToken = await issueSession(res, user)
  return res.json({ accessToken, user: user.toProfileJSON() })
}

async function refresh(req, res) {
  const token = req.cookies[REFRESH_COOKIE_NAME]
  if (!token) {
    return res.status(401).json({ message: "Não autenticado." })
  }

  try {
    const payload = verifyRefreshToken(token)
    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(401).json({ message: "Não autenticado." })
    }
    const accessToken = await issueSession(res, user)
    return res.json({ accessToken })
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada." })
  }
}

function logout(_req, res) {
  clearRefreshCookie(res)
  return res.status(204).send()
}

async function forgotPassword(req, res) {
  const { email } = req.body
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Informe um e-mail válido." })
  }

  // Resposta genérica sempre, independentemente de o e-mail existir ou não,
  // para não revelar quais e-mails estão cadastrados (enumeration attack).
  const genericResponse = { message: "Se o e-mail estiver cadastrado, enviamos instruções de redefinição." }

  const user = await User.findByEmail(email)
  if (!user) {
    return res.json(genericResponse)
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  user.resetTokenHash = hashToken(rawToken)
  user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save()

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`
  try {
    await sendPasswordResetEmail(user.getDecryptedEmail(), resetUrl)
  } catch (err) {
    console.error("Falha ao enviar e-mail de redefinição:", err.message)
  }

  return res.json(genericResponse)
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token e nova senha são obrigatórios." })
  }
  if (!isPasswordValid(newPassword)) {
    return res.status(400).json({ message: PASSWORD_REQUIREMENTS_MESSAGE })
  }

  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  })
  if (!user) {
    return res.status(400).json({ message: "Link inválido ou expirado. Solicite uma nova redefinição." })
  }

  await user.setPassword(newPassword)
  user.resetTokenHash = null
  user.resetTokenExpires = null
  await user.save()

  return res.json({ message: "Senha redefinida com sucesso." })
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword }
