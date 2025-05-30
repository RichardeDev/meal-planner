import { type NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { pool } from "@/lib/mysql-utils"
import { sendEmail } from "@/lib/email-utils"

// Types
type User = {
  id: string
  name: string
  email: string
  password: string
  role: "user" | "admin"
  pending: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Tous les champs sont requis" }, { status: 400 })
    }

    const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

    const existingUser = (existingUsers as Array<{ email: string }>).find((u) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ message: "Cet email est déjà utilisé" }, { status: 400 })
    }

    await pool.query(
      "INSERT INTO users (name, email, password, role, pending) VALUES (?, ?, ?, 'user', TRUE)",
      [name, email, password]
    )

    const [admins] = await pool.query("SELECT email, name FROM users WHERE role = 'admin'")
    const adminList = admins as Array<{ email: string; name: string }>

    for (const admin of adminList) {
      await sendEmail({
        to: admin.email,
        subject: "Nouvelle demande d'inscription",
        text: `Une nouvelle demande d'inscription a été reçue de ${name} (${email}). Veuillez valider cette demande.`,
        html: `
          <h1>Nouvelle demande d'inscription</h1>
          <p>Une nouvelle demande a été soumise par :</p>
          <ul>
            <li><strong>Nom :</strong> ${name}</li>
            <li><strong>Email :</strong> ${email}</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard/users" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Gérer les utilisateurs
          </a>
        `,
      })
    }

    return NextResponse.json({ message: "Inscription envoyée — en attente de validation" }, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error.message)
    return NextResponse.json({ message: "Erreur serveur interne", error: error.message }, { status: 500 })
  }
}