const nodemailer = require("nodemailer")

let transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

async function sendPasswordResetEmail(to, resetUrl) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Redefinição de senha - EduGames",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1E3319;">Redefinição de senha</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta EduGames.</p>
        <p>Clique no link abaixo para criar uma nova senha. Ele expira em 1 hora.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #86BB79; color: #1A3D12; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Redefinir senha
          </a>
        </p>
        <p>Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
      </div>
    `,
  })
}

module.exports = { sendPasswordResetEmail }
