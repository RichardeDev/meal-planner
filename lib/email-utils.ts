import nodemailer from "nodemailer"

type EmailOptions = {
  to: string
  subject: string
  text: string
  html: string
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ethereal.email",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "votre-email@example.com",
    pass: process.env.EMAIL_PASSWORD || "votre-mot-de-passe",
  },
})

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  try {

    // if (process.env.NODE_ENV === "development") {
    //   console.log("Mode développement: simulation d'envoi d'email")
    //   return true
    // }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Planificateur de Repas" <no-reply@example.com>',
      to,
      subject,
      text,
      html,
    })

    console.log(`Email envoyé: ${info.messageId}`)
    return true
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error)
    return false
  }
}
