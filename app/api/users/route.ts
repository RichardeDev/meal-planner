import { type NextRequest, NextResponse } from "next/server"
import { getAllUsers, createUser } from "@/lib/prisma-utils"
import bcrypt from "bcryptjs"

// GET /api/users - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs" }, { status: 500 })
  }
}

// POST /api/users - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = "user" } = await request.json()

    // Validation de base
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    // Vérifier si l'email existe déjà
    const users = await getAllUsers()
    const existingUser = users.find((user) => user.email === email)

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
      role,
    })

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json({user: userWithoutPassword}, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 })
  }
}
