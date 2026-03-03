import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/prisma-utils"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email et mot de passe requis" }, { status: 400 })
    }

    // Récupérer l'utilisateur par email
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 })
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log(`Mot de passe invalide pour: ${email}`)
      return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 })
    }

    // Retourner les informations de l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Erreur lors de la connexion:", error)
    return NextResponse.json({ message: "Erreur lors de la connexion" }, { status: 500 })
  }
}
