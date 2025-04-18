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

// PUT /api/meals/:id - Mettre à jour un repas
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updatedMeal = (await request.json()) as Omit<Meal, "id">

    // Validation de base
    if (!updatedMeal.name) {
      return NextResponse.json({ error: "Le nom du repas est requis" }, { status: 400 })
    }

    const success = await updateMealDetails(id, updatedMeal.name, updatedMeal.description || "")

    if (!success) {
      return NextResponse.json({ error: "Repas non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du repas" }, { status: 500 })
  }
}

// DELETE /api/meals/:id - Supprimer un repas
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

// Fonction pour créer un nouveau repas
export async function createMeal(name: string, description: string): Promise<Meal> {
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

// Fonction pour mettre à jour les détails d'un repas
export async function updateMealDetails(mealId: string, name: string, description: string): Promise<boolean> {
  let found = false

  await updateData("meals", (meals) => {
    const index = meals.findIndex((meal) => meal.id === mealId)
    if (index === -1) return meals

    found = true
    meals[index] = { ...meals[index], name, description }
    return [...meals]
  })

  if (found) {
    // Mettre à jour les repas dans les jours de la semaine pour toutes les semaines
    await updateData("weeklyMealsStorage", (storage) => {
      const updatedStorage = { ...storage }

      Object.keys(updatedStorage).forEach((weekKey) => {
        const weekMeals = updatedStorage[weekKey]

        weekMeals.forEach((day) => {
          day.meals.forEach((meal, index) => {
            if (meal.id === mealId) {
              day.meals[index] = { id: mealId, name, description }
            }
          })
        })
      })

      return updatedStorage
    })
  }

  return found
}

// Fonction pour supprimer un repas
export async function deleteMeal(mealId: string): Promise<boolean> {
  // Vérifier si le repas est utilisé dans une semaine
  const data = await readData()
  let isUsed = false

  Object.values(data.weeklyMealsStorage).forEach((weekMeals) => {
    weekMeals.forEach((day) => {
      if (day.meals.some((meal) => meal.id === mealId)) {
        isUsed = true
      }
    })
  })

  // Si le repas est utilisé, ne pas le supprimer
  if (isUsed) {
    return true // Retourne true pour indiquer que le repas est utilisé
  }

  // Supprimer le repas de la liste
  await updateData("meals", (meals) => meals.filter((meal) => meal.id !== mealId))

  // Supprimer les sélections associées à ce repas
  await updateData("userSelections", (selections) => selections.filter((selection) => selection.mealId !== mealId))

  return false // Retourne false pour indiquer que le repas a été supprimé
}
