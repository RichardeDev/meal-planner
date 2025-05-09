import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type PendingUser } from "@/lib/json-utils"
import { sendEmail } from "@/lib/email-utils"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation de base
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Tous les champs sont requis" }, { status: 400 })
    }

    // Vérifier si l'email existe déjà
    const data = await readData()
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

    // Créer un nouvel utilisateur en attente
    const newPendingUser: PendingUser = {
      id: `pending_${Date.now()}`,
      name,
      email,
      password, // Note: Dans une application réelle, le mot de passe devrait être hashé
      role: "user", // Spécifier explicitement "user" comme une chaîne littérale
      createdAt: new Date().toISOString(),
    }

    // Ajouter l'utilisateur à la liste des utilisateurs en attente
    if (!data.pendingUsers) {
      data.pendingUsers = []
    }

    data.pendingUsers.push(newPendingUser)
    await updateData("pendingUsers", () => data.pendingUsers || [])

    // Envoyer un email à l'administrateur
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
