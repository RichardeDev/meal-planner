import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type UserSelection } from "@/lib/json-utils"

// GET /api/selections - Récupérer toutes les sélections
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const dayId = searchParams.get("dayId")
    const weekOffset = searchParams.get("weekOffset")

    const data = await readData()
    let selections = data.userSelections

    // Filtrer par utilisateur si spécifié
    if (userId) {
      selections = selections.filter((selection) => selection.userId === userId)
    }

    // Filtrer par jour si spécifié
    if (dayId) {
      selections = selections.filter((selection) => selection.dayId === dayId)
    }

    // Filtrer par semaine si spécifié
    if (weekOffset !== null) {
      const weekOffsetNum = Number.parseInt(weekOffset)
      selections = selections.filter(
        (selection) =>
          selection.weekOffset === weekOffsetNum || (selection.weekOffset === undefined && weekOffsetNum === 0), // Pour la compatibilité avec les anciennes données
      )
    }

    return NextResponse.json(selections)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des sélections" }, { status: 500 })
  }
}

// POST /api/selections - Créer ou mettre à jour une sélection
export async function POST(request: NextRequest) {
  try {
    const { userId, userName, dayId, mealId, weekOffset = 0 } = await request.json()

    if (!userId || !userName || !dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const success = await selectMeal(userId, userName, dayId, mealId, weekOffset)

    if (!success) {
      return NextResponse.json({ error: "Erreur lors de la sélection du repas" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la sélection du repas" }, { status: 500 })
  }
}

// Fonction pour sélectionner un repas
export async function selectMeal(
  userId: string,
  userName: string,
  dayId: string,
  mealId: string,
  weekOffset = 0,
): Promise<boolean> {
  try {
    await updateData("userSelections", (selections) => {
      // Check if user already has a selection for this day and week
      const existingSelectionIndex = selections.findIndex(
        (selection) =>
          selection.userId === userId &&
          selection.dayId === dayId &&
          (selection.weekOffset === weekOffset || (selection.weekOffset === undefined && weekOffset === 0)),
      )

      if (existingSelectionIndex !== -1) {
        // Update existing selection
        selections[existingSelectionIndex].mealId = mealId
        // Ensure weekOffset is set
        selections[existingSelectionIndex].weekOffset = weekOffset
      } else {
        // Add new selection
        selections.push({ userId, userName, dayId, mealId, weekOffset })
      }

      return selections
    })

    return true
  } catch (error) {
    console.error("Erreur lors de la sélection du repas:", error)
    return false
  }
}

// Fonction pour récupérer les sélections d'un utilisateur pour une semaine spécifique
export async function getUserSelectionsForWeek(userId: string, weekOffset = 0): Promise<UserSelection[]> {
  try {
    const data = await readData()
    return data.userSelections.filter(
      (selection) =>
        selection.userId === userId &&
        (selection.weekOffset === weekOffset || (selection.weekOffset === undefined && weekOffset === 0)),
    )
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections de l'utilisateur:", error)
    return []
  }
}

// Fonction pour récupérer les sélections pour un jour d'une semaine spécifique
export async function getMealSelectionsForDayAndWeek(dayId: string, weekOffset = 0): Promise<UserSelection[]> {
  try {
    const data = await readData()
    return data.userSelections.filter(
      (selection) =>
        selection.dayId === dayId &&
        (selection.weekOffset === weekOffset || (selection.weekOffset === undefined && weekOffset === 0)),
    )
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections pour le jour:", error)
    return []
  }
}

// Fonction pour récupérer toutes les sélections pour une semaine spécifique
export async function getAllSelectionsForWeek(weekOffset = 0): Promise<UserSelection[]> {
  try {
    const data = await readData()
    return data.userSelections.filter(
      (selection) => selection.weekOffset === weekOffset || (selection.weekOffset === undefined && weekOffset === 0),
    )
  } catch (error) {
    console.error("Erreur lors de la récupération de toutes les sélections:", error)
    return []
  }
}
