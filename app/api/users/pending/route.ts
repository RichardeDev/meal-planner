import { type NextRequest, NextResponse } from "next/server"
import { getAllPendingUsers } from "@/lib/prisma-utils"

// GET /api/users/pending - Récupérer tous les utilisateurs en attente
export async function GET(request: NextRequest) {
  try {
    const pendingUsers = await getAllPendingUsers()

    // Retourner les utilisateurs en attente sans les mots de passe
    const usersWithoutPasswords = pendingUsers.map(({ password, ...user }) => user)

    return NextResponse.json(usersWithoutPasswords)
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs en attente:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs en attente" }, { status: 500 })
  }
}
