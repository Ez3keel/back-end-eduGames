// Mínimo 8 caracteres, com pelo menos uma letra, um número e um caractere especial.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

function isPasswordValid(password) {
  return typeof password === "string" && PASSWORD_REGEX.test(password)
}

const PASSWORD_REQUIREMENTS_MESSAGE =
  "A senha deve ter pelo menos 8 caracteres, incluindo letras, números e um caractere especial."

module.exports = { isPasswordValid, PASSWORD_REQUIREMENTS_MESSAGE }
