import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type PendingUser } from "@/lib/json-utils"
import { sendEmail } from "@/lib/email-utils"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation de base
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Tous les champs sont requis" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Vérifier si l'email existe déjà
    const data = await readData()

    if (data.users.length === 0) {
      const newId = (Math.max(...data.users.map((user) => Number.parseInt(user.id) || 0), 0) + 1).toString()

      const newUser = {
        id: newId,
        name: name,
        email: email,
        password: hashedPassword, 
        role: "admin",
      }

      await updateData("users", (users) => [...users, newUser])
      return NextResponse.json({ message: "Premier administrateur créé avec succès" }, { status: 201 })
    }

    const existingUser = data.users.find((user) => user.email === email)
    const existingPendingUser = data.pendingUsers?.find((user) => user.email === email)

    if (existingUser) {
      return NextResponse.json({ message: "Cet email est déjà utilisé" }, { status: 400 })
    }

    if (existingPendingUser) {
      return NextResponse.json(
        { message: "Une demande d'inscription avec cet email est déjà en attente de validation" },
        { status: 400 },
      )
    }

    const newPendingUser: PendingUser = {
      id: `pending_${Date.now()}`,
      name,
      email,
      password: hashedPassword, 
      role: "user", 
      createdAt: new Date().toISOString(),
    }

    if (!data.pendingUsers) {
      data.pendingUsers = []
    }

    data.pendingUsers.push(newPendingUser)
    await updateData("pendingUsers", () => data.pendingUsers || [])

    const adminUsers = data.users.filter((user) => user.role === "admin")
    for (const admin of adminUsers) {
      await sendEmail({
        to: admin.email,
        subject: "Nouvelle demande d'inscription",
        text: `Une nouvelle demande d'inscription a été reçue de ${name} (${email}). Veuillez vous connecter à l'application pour valider cette demande.`,
        html: `
          <h1>Nouvelle demande d'inscription</h1>
          <p>Une nouvelle demande d'inscription a été reçue avec les informations suivantes :</p>
          <ul>
            <li><strong>Nom :</strong> ${name}</li>
            <li><strong>Email :</strong> ${email}</li>
          </ul>
          <p>Veuillez vous connecter à l'application pour valider cette demande.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard/users" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Gérer les utilisateurs</a>
        `,
      })
    }

    return NextResponse.json({ message: "Inscription en attente de validation" }, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    return NextResponse.json({ message: "Erreur lors de l'inscription" }, { status: 500 })
  }
}
