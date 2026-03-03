import { type NextRequest, NextResponse } from "next/server"
import { updateMeal, deleteMeal } from "@/lib/prisma-utils"

// PUT /api/meals/:id - Mettre à jour un repas
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params
    const { name, description } = await request.json()

    // Validation de base
    if (!name) {
      return NextResponse.json({ error: "Le nom du repas est requis" }, { status: 400 })
    }

    const updatedMeal = await updateMeal(id, { name, description: description || "" })

    if (!updatedMeal) {
      return NextResponse.json({ error: "Repas non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du repas" }, { status: 500 })
  }
}

// DELETE /api/meals/:id - Supprimer un repas
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params
    const isUsed = await deleteMeal(id)

    if (isUsed) {
      return NextResponse.json({ error: "Ce repas est utilisé et ne peut pas être supprimé" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression du repas" }, { status: 500 })
  }
}
