import { type NextRequest, NextResponse } from "next/server"
import { getUserById, getUserByEmail, updateUser, deleteUser, deleteAllUserSelections } from "@/lib/prisma-utils"
import bcrypt from "bcryptjs"

// GET /api/users/:slug - Récupérer un utilisateur par ID ou email
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const { slug } = params

    let user = null

    // Essayer d'abord de récupérer par ID (si c'est un nombre)
    if (/^\d+$/.test(slug)) {
      user = await getUserById(slug)
    } else {
      // Sinon, considérer que c'est un email
      user = await getUserByEmail(slug)
    }

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération de l'utilisateur" }, { status: 500 })
  }
}

// PUT /api/users/:slug - Mettre à jour un utilisateur
export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const { slug } = params
    const updates = await request.json()

    // Si un nouveau mot de passe est fourni, le hasher
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10)
    }

    const updatedUser = await updateUser(slug, updates)

    if (!updatedUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Retourner l'utilisateur mis à jour sans le mot de passe
    const { password, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'utilisateur" }, { status: 500 })
  }
}

// DELETE /api/users/:slug - Supprimer un utilisateur
export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const { slug } = params

    const success = await deleteUser(slug)

    if (!success) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }
    await deleteAllUserSelections(slug)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression de l'utilisateur" }, { status: 500 })
  }
}
