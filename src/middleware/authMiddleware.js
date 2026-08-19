const { verifyAccessToken } = require("../utils/tokens")

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: "Não autenticado." })
  }

  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada." })
  }
}

module.exports = requireAuth
