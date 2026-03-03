import { type NextRequest, NextResponse } from "next/server"
import {
  getWeeklyMeals,
  createWeeklyMeals,
  updateWeeklyMeal,
  addMealToWeeklyDay,
  removeMealFromWeeklyDay,
  getWeekKey,
  getWeekDates,
  getAllMeals,
} from "@/lib/prisma-utils"

// GET /api/weekly-meals?weekOffset=0 - Récupérer les repas pour une semaine spécifique
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const weekOffset = Number.parseInt(searchParams.get("weekOffset") || "0")

    const weekKey = getWeekKey(weekOffset)
    let weeklyMeals = await getWeeklyMeals(weekKey)
    const meals = await getAllMeals()

    // Si aucune donnée n'existe pour cette semaine, générer de nouvelles données
    if (weeklyMeals.length === 0 && meals.filter(Boolean).length > 0) {
      const weekDates = getWeekDates(weekOffset)
    const mealProvisoire = {
      "id": "0",
      "name": "Oupsss!!!!",
      "description": "Repas non specifier",
    }

      // Générer des repas pour la semaine
      const newWeeklyMeals = weekDates.map((dayInfo, dayIndex) => {
        const startIndex = (dayIndex * 2) % meals.length
        const dayMeals = [
          mealProvisoire,
          // meals[startIndex % meals.length],
          // meals[(startIndex + 1) % meals.length],
          // meals[(startIndex + 2) % meals.length],
        ]

        return {
          day: dayInfo.day,
          date: dayInfo.date,
          meals: dayMeals,
        }
      })

      // Sauvegarder en base de données
      await createWeeklyMeals(weekKey, newWeeklyMeals)
      weeklyMeals = newWeeklyMeals
    }

    return NextResponse.json(weeklyMeals)
  } catch (error) {
    console.error("Erreur lors de la récupération des repas de la semaine:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des repas de la semaine" }, { status: 500 })
  }
}

// PUT /api/weekly-meals/update-meal - Mettre à jour un repas dans une semaine
export async function PUT(request: NextRequest) {
  try {
    const { dayId, oldMealId, newMealId, weekOffset = 0 } = await request.json()

    if (!dayId || !oldMealId || !newMealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const weekKey = getWeekKey(weekOffset)
    const success = await updateWeeklyMeal(weekKey, dayId, oldMealId, newMealId)

    if (!success) {
      return NextResponse.json({ error: "Repas ou jour non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du repas" }, { status: 500 })
  }
}

// POST /api/weekly-meals - Ajouter un repas à un jour
export async function POST(request: NextRequest) {
  try {
    const { dayId, mealId, weekOffset = 0 } = await request.json()

    if (!dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const weekKey = getWeekKey(weekOffset)
    const success = await addMealToWeeklyDay(weekKey, dayId, mealId)

    if (!success) {
      return NextResponse.json({ error: "Repas ou jour non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de l'ajout du repas" }, { status: 500 })
  }
}

// DELETE /api/weekly-meals/remove-meal - Supprimer un repas d'un jour
export async function DELETE(request: NextRequest) {
  try {
    const { dayId, mealId, weekOffset = 0 } = await request.json()

    if (!dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const weekKey = getWeekKey(weekOffset)
    const success = await removeMealFromWeeklyDay(weekKey, dayId, mealId)

    if (!success) {
      return NextResponse.json({ error: "Repas ou jour non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression du repas" }, { status: 500 })
  }
}
