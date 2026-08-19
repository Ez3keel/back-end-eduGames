const dns = require("dns")
const mongoose = require("mongoose")

// O resolvedor de DNS padrão do SO às vezes falha ao consultar os registros
// SRV usados por "mongodb+srv://" (comum em redes de provedores/roteadores no Brasil).
// Forçamos DNS públicos só para esta aplicação.
dns.setServers(["8.8.8.8", "1.1.1.1"])

async function connectDB() {
  mongoose.set("strictQuery", true)
  await mongoose.connect(process.env.MONGODB_URI)
  console.log("MongoDB conectado")
}

module.exports = connectDB
