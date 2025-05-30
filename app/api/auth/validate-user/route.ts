import { type NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { pool } from "@/lib/mysql-utils"
import { sendEmail } from "@/lib/email-utils"

// Types
type User = {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  pending: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { id: pendingUserId, action } = await request.json()

    if (!pendingUserId || !action) {
      return NextResponse.json({ message: "Paramètres manquants : id et action requis" }, { status: 400 })
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ message: "Action invalide" }, { status: 400 })
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [pendingUserId])
    const user = (rows as Array<User>)[0]

    if (!user || user.pending === false) {
      return NextResponse.json({ message: "Utilisateur non trouvé ou déjà validé" }, { status: 404 })
    }

    if (action === "approve") {
      await pool.query("UPDATE users SET role = 'user', pending = FALSE WHERE id = ?", [pendingUserId])

      await sendEmail({
        to: user.email,
        subject: "Votre inscription a été validée",
        text: `Bonjour ${user.name}, votre compte a été validé. Vous pouvez maintenant vous connecter.`,
        html: `
          <h1>Votre compte a été validé</h1>
          <p>Bonjour ${user.name},</p>
          <p>Votre inscription a été approuvée. Vous pouvez désormais sélectionner vos repas.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Se connecter
          </a>
        `,
      })

      return NextResponse.json({ message: "Utilisateur validé avec succès" })
    } else {
      await pool.query("DELETE FROM users WHERE id = ?", [pendingUserId])

      await sendEmail({
        to: user.email,
        subject: "Demande d'inscription rejetée",
        text: `Bonjour ${user.name}, votre demande d'inscription a été rejetée. Veuillez nous contacter pour plus d'informations.`,
        html: `
          <h1>Demande d'inscription rejetée</h1>
          <p>Bonjour ${user.name},</p>
          <p>Votre demande a été refusée. Veuillez contacter l'administrateur pour plus d'informations.</p>
        `,
      })

      return NextResponse.json({ message: "Utilisateur rejeté et supprimé" })
    }
  } catch (error: any) {
    console.error("Erreur lors de la validation de l'utilisateur:", error.message)
    return NextResponse.json({ message: "Erreur serveur interne", error: error.message }, { status: 500 })
  }
}