require("dotenv").config()

const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const cookieParser = require("cookie-parser")
const connectDB = require("./config/db")
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get("/api/health", (_req, res) => res.json({ status: "ok" }))
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)

app.use((_req, res) => res.status(404).json({ message: "Rota não encontrada." }))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: "Erro interno do servidor." })
})

console.log("FRONTEND_URL lido pelo processo:", JSON.stringify(process.env.FRONTEND_URL))

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
  })
  .catch((err) => {
    console.error("Falha ao conectar ao MongoDB:", err.message)
    process.exit(1)
  })
