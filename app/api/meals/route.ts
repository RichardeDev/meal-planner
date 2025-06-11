import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type Meal } from "@/lib/json-utils"

// GET /api/meals - Récupérer tous les repas
export async function GET(request: NextRequest) {
  try {
    const data = await readData()
    return NextResponse.json(data.meals)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des repas" }, { status: 500 })
  }
}

// POST /api/meals - Créer un nouveau repas
export async function POST(request: NextRequest) {
  try {
    const newMeal = (await request.json()) as Omit<Meal, "id">

    // Validation de base
    if (!newMeal.name) {
      return NextResponse.json({ error: "Le nom du repas est requis" }, { status: 400 })
    }

    const createdMeal = await createMeal(newMeal.name, newMeal.description || "")
    return NextResponse.json(createdMeal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création du repas" }, { status: 500 })
  }
}

// Fonction pour créer un nouveau repas
async function createMeal(name: string, description: string): Promise<Meal> {
  const newMeal: Omit<Meal, "id"> = {
    name,
    description,
  }

  let createdMeal: Meal = { id: "", ...newMeal }

  await updateData("meals", (meals) => {
    // Générer un nouvel ID
    const newId = (Math.max(...meals.map((meal) => Number.parseInt(meal.id)), 0) + 1).toString()
    createdMeal = { id: newId, ...newMeal }

    return [...meals, createdMeal]
  })

  return createdMeal
}
