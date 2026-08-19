const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const { encrypt, decrypt, lookupHash } = require("../utils/crypto")

const userSchema = new mongoose.Schema(
  {
    // Dados sensíveis (nome, e-mail) ficam cifrados em repouso (AES-256-GCM).
    // Os campos *Hash guardam um HMAC determinístico usado para busca/unicidade,
    // já que o ciphertext do AES-GCM muda a cada gravação.
    nameEncrypted: { type: String, required: true },
    emailEncrypted: { type: String, required: true },
    emailHash: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Token de redefinição de senha: guardamos só o hash (SHA-256) do token
    // enviado por e-mail, nunca o valor puro, para que um vazamento do banco
    // não permita a redefinição de senhas de terceiros.
    resetTokenHash: { type: String, index: true, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true },
)

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 12)
}

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash)
}

userSchema.methods.setName = function setName(name) {
  this.nameEncrypted = encrypt(name)
}

userSchema.methods.setEmail = function setEmail(email) {
  this.emailEncrypted = encrypt(email.toLowerCase().trim())
  this.emailHash = lookupHash(email)
}

userSchema.methods.toProfileJSON = function toProfileJSON() {
  return {
    id: this._id,
    name: decrypt(this.nameEncrypted),
    email: decrypt(this.emailEncrypted),
    username: this.username,
    createdAt: this.createdAt,
  }
}

userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ emailHash: lookupHash(email) })
}

userSchema.methods.getDecryptedEmail = function getDecryptedEmail() {
  return decrypt(this.emailEncrypted)
}

module.exports = mongoose.model("User", userSchema)
