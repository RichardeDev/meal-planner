import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData } from "@/lib/json-utils"
import { sendEmail } from "@/lib/email-utils"

export async function POST(request: NextRequest) {
  try {
    const { pendingUserId, action } = await request.json()

    if (!pendingUserId || !action) {
      return NextResponse.json({ message: "ID utilisateur et action requis" }, { status: 400 })
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ message: "Action invalide" }, { status: 400 })
    }

    const data = await readData()

    // Vérifier si pendingUsers existe
    if (!data.pendingUsers) {
      data.pendingUsers = []
    }

    const pendingUserIndex = data.pendingUsers.findIndex((user) => user.id === pendingUserId)

    if (pendingUserIndex === -1) {
      return NextResponse.json({ message: "Utilisateur en attente non trouvé" }, { status: 404 })
    }

    const pendingUser = data.pendingUsers[pendingUserIndex]

    if (action === "approve") {
      // Générer un nouvel ID pour l'utilisateur
      const newId = (Math.max(...data.users.map((user) => Number.parseInt(user.id) || 0), 0) + 1).toString()

      // Créer un nouvel utilisateur validé
      const newUser = {
        id: newId,
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password, // Note: Dans une application réelle, le mot de passe devrait être hashé
        role: "user",
      }

      // Ajouter l'utilisateur à la liste des utilisateurs
      await updateData("users", (users) => [...users, newUser])

      // Envoyer un email de confirmation à l'utilisateur
      await sendEmail({
        to: pendingUser.email,
        subject: "Votre inscription a été validée",
        text: `Bonjour ${pendingUser.name}, votre inscription a été validée. Vous pouvez maintenant vous connecter à l'application.`,
        html: `
          <h1>Votre inscription a été validée</h1>
          <p>Bonjour ${pendingUser.name},</p>
          <p>Votre inscription a été validée par un administrateur. Vous pouvez maintenant vous connecter à l'application.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Se connecter</a>
        `,
      })
    } else {
      // Envoyer un email de rejet à l'utilisateur
      await sendEmail({
        to: pendingUser.email,
        subject: "Votre demande d'inscription a été rejetée",
        text: `Bonjour ${pendingUser.name}, votre demande d'inscription a été rejetée. Veuillez contacter l'administrateur pour plus d'informations.`,
        html: `
          <h1>Votre demande d'inscription a été rejetée</h1>
          <p>Bonjour ${pendingUser.name},</p>
          <p>Votre demande d'inscription a été rejetée par un administrateur. Veuillez contacter l'administrateur pour plus d'informations.</p>
        `,
      })
    }

    // Supprimer l'utilisateur de la liste des utilisateurs en attente
    await updateData("pendingUsers", (pendingUsers) => pendingUsers?.filter((user) => user.id !== pendingUserId))

    return NextResponse.json({
      message: action === "approve" ? "Utilisateur validé avec succès" : "Utilisateur rejeté avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la validation de l'utilisateur:", error)
    return NextResponse.json({ message: "Erreur lors de la validation de l'utilisateur" }, { status: 500 })
  }
}
