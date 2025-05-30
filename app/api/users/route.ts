import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type User } from "@/lib/json-utils"
import { pool } from "@/lib/mysql-utils"



export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role FROM users")
    return NextResponse.json(rows)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des utilisateurs:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role } = body

    // Validation de base
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Données utilisateur incomplètes" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers]: any = await pool.query("SELECT * FROM users WHERE email = ?", [email])
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    // Générer un nouvel ID utilisateur
    const id = Date.now().toString()

    // Insérer l'utilisateur en base de données
    await pool.query("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", [
      name,
      email,
      role,
    ])

    return NextResponse.json({ id, name, email, role }, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la création d'un utilisateur:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}