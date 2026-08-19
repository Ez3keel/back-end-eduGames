const crypto = require("crypto")

const ALGORITHM = "aes-256-gcm"
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, "base64")
const hashKey = Buffer.from(process.env.HASH_KEY, "base64")

// AES-256-GCM: cada campo é cifrado com um IV aleatório, então o mesmo texto
// gera ciphertexts diferentes a cada chamada (não é buscável diretamente).
function encrypt(plainText) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv)
  const ciphertext = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, ciphertext].map((buf) => buf.toString("base64")).join(":")
}

function decrypt(payload) {
  const [ivB64, authTagB64, ciphertextB64] = payload.split(":")
  const iv = Buffer.from(ivB64, "base64")
  const authTag = Buffer.from(authTagB64, "base64")
  const ciphertext = Buffer.from(ciphertextB64, "base64")

  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv)
  decipher.setAuthTag(authTag)
  const plainText = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plainText.toString("utf8")
}

// HMAC determinístico: usado como índice de busca/unicidade para campos
// criptografados (o ciphertext do AES-GCM não é igual entre chamadas).
function lookupHash(value) {
  return crypto.createHmac("sha256", hashKey).update(String(value).trim().toLowerCase()).digest("hex")
}

module.exports = { encrypt, decrypt, lookupHash }
