import { type NextRequest, NextResponse } from "next/server"
import { getAllMeals, createMeal } from "@/lib/prisma-utils"

// GET /api/meals - Récupérer tous les repas
export async function GET(request: NextRequest) {
  try {
    const meals = await getAllMeals()
    return NextResponse.json(meals)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des repas" }, { status: 500 })
  }
}

// POST /api/meals - Créer un nouveau repas
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    // Validation de base
    if (!name) {
      return NextResponse.json({ error: "Le nom du repas est requis" }, { status: 400 })
    }

    const createdMeal = await createMeal({ name, description: description || "" })
    return NextResponse.json(createdMeal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création du repas" }, { status: 500 })
  }
}
