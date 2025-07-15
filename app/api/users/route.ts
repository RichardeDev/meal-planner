import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type User } from "@/lib/json-utils"
import bcrypt from "bcryptjs"

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
    const {name, email, password, role} = await request.json()

    // Validation de base
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Données utilisateur incomplètes" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser: User = {
      id: "",
      name: name,
      email: email,
      password: hashedPassword,
      role: role
    }

    await updateData("users", (users) => {
      // Générer un nouvel ID
      const newId = (Math.max(...users.map((user) => Number.parseInt(user.id)), 0) + 1).toString()
      newUser.id = newId

      return [...users, newUser]
    })

    return NextResponse.json({user: newUser}, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 })
  }
}
