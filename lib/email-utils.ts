import nodemailer from "nodemailer"

type EmailOptions = {
  to: string
  subject: string
  text: string
  html: string
}

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  // Pour le développement, on utilise un service de test qui simule l'envoi d'emails
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
    // Afficher les informations de l'email dans la console pour le débogage
    console.log(`Envoi d'un email à ${to}:`)
    console.log(`Sujet: ${subject}`)
    console.log(`Texte: ${text}`)
    console.log(`HTML: ${html}`)

    // Dans un environnement de développement, on peut simuler l'envoi d'email
    if (process.env.NODE_ENV === "development") {
      console.log("Mode développement: simulation d'envoi d'email")
      return true
    }

    // Envoi de l'email
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
