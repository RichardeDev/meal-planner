import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type User } from "@/lib/json-utils"

// GET /api/users - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const data = await readData()
    return NextResponse.json(data.users)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs" }, { status: 500 })
  }
}

// POST /api/users - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const newUser = (await request.json()) as User

    // Validation de base
    if (!newUser.name || !newUser.email || !newUser.role) {
      return NextResponse.json({ error: "Données utilisateur incomplètes" }, { status: 400 })
    }

    await updateData("users", (users) => {
      // Générer un nouvel ID
      const newId = (Math.max(...users.map((user) => Number.parseInt(user.id)), 0) + 1).toString()
      newUser.id = newId

      return [...users, newUser]
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 })
  }
}
