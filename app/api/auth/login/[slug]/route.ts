import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/prisma-utils"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string, password: string }> }) {
  try {
    const params = await context.params
    console.log(params)
    const { slug: email } = params
    // const { password } = await request.json()

    console.log(`Tentative de connexion pour: ${email}`)

    // if (!email || !password) {
    if (!email) {
      return NextResponse.json({ message: "Email et mot de passe requis" }, { status: 400 })
    }

    // Récupérer l'utilisateur par email
    const user = await getUserByEmail(email)

    if (!user) {
      console.log(`Utilisateur non trouvé: ${email}`)
      return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 })
    }

    // Vérifier le mot de passe
    // const isPasswordValid = await bcrypt.compare(password, user.password)

    // if (!isPasswordValid) {
    //   console.log(`Mot de passe invalide pour: ${email}`)
    //   return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 })
    // }

    console.log(`Connexion réussie pour: ${email}`)

    // Retourner les informations de l'utilisateur sans le mot de passe
    // const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      message: "Connexion réussie",
      user,
    })
  } catch (error) {
    console.error("Erreur lors de la connexion:", error)
    return NextResponse.json({ message: "Erreur lors de la connexion" }, { status: 500 })
  }
}
