const User = require("../models/User")
const { isPasswordValid, PASSWORD_REQUIREMENTS_MESSAGE } = require("../utils/validatePassword")

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getMe(req, res) {
  const user = await User.findById(req.userId)
  if (!user) return res.status(404).json({ message: "Usuário não encontrado." })
  return res.json({ user: user.toProfileJSON() })
}

async function updateProfile(req, res) {
  const { username, email } = req.body
  const user = await User.findById(req.userId)
  if (!user) return res.status(404).json({ message: "Usuário não encontrado." })

  if (username && username.length < 3) {
    return res.status(400).json({ message: "O nome de usuário deve ter pelo menos 3 caracteres." })
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "E-mail inválido." })
  }

  if (username && username.toLowerCase().trim() !== user.username) {
    const taken = await User.findOne({ username: username.toLowerCase().trim(), _id: { $ne: user._id } })
    if (taken) return res.status(409).json({ message: "Nome de usuário já está em uso." })
    user.username = username.toLowerCase().trim()
  }

  if (email) {
    const existing = await User.findByEmail(email)
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(409).json({ message: "E-mail já está em uso." })
    }
    user.setEmail(email)
  }

  await user.save()
  return res.json({ user: user.toProfileJSON() })
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Preencha a senha atual e a nova senha." })
  }
  if (!isPasswordValid(newPassword)) {
    return res.status(400).json({ message: PASSWORD_REQUIREMENTS_MESSAGE })
  }

  const user = await User.findById(req.userId)
  if (!user) return res.status(404).json({ message: "Usuário não encontrado." })

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ message: "Senha atual incorreta." })
  }

  await user.setPassword(newPassword)
  await user.save()
  return res.status(204).send()
}

module.exports = { getMe, updateProfile, changePassword }
