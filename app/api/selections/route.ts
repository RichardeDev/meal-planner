import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type UserSelection } from "@/lib/json-utils"

// GET /api/selections - Récupérer toutes les sélections
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const dayId = searchParams.get("dayId")

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

    return NextResponse.json(selections)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des sélections" }, { status: 500 })
  }
}

// POST /api/selections - Créer ou mettre à jour une sélection
export async function POST(request: NextRequest) {
  try {
    const { userId, userName, dayId, mealId } = await request.json()

    if (!userId || !userName || !dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const success = await selectMeal(userId, userName, dayId, mealId)

    if (!success) {
      return NextResponse.json({ error: "Erreur lors de la sélection du repas" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la sélection du repas" }, { status: 500 })
  }
}

// Fonction pour sélectionner un repas
export async function selectMeal(userId: string, userName: string, dayId: string, mealId: string): Promise<boolean> {
  try {
    await updateData("userSelections", (selections) => {
      // Check if user already has a selection for this day
      const existingSelectionIndex = selections.findIndex(
        (selection) => selection.userId === userId && selection.dayId === dayId,
      )

      if (existingSelectionIndex !== -1) {
        // Update existing selection
        selections[existingSelectionIndex].mealId = mealId
      } else {
        // Add new selection
        selections.push({ userId, userName, dayId, mealId })
      }

      return selections
    })

    return true
  } catch (error) {
    console.error("Erreur lors de la sélection du repas:", error)
    return false
  }
}

// Fonction pour récupérer les sélections d'un utilisateur
export async function getUserSelections(userId: string): Promise<UserSelection[]> {
  try {
    const data = await readData()
    return data.userSelections.filter((selection) => selection.userId === userId)
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections de l'utilisateur:", error)
    return []
  }
}

// Fonction pour récupérer les sélections pour un jour
export async function getMealSelectionsForDay(dayId: string): Promise<UserSelection[]> {
  try {
    const data = await readData()
    return data.userSelections.filter((selection) => selection.dayId === dayId)
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections pour le jour:", error)
    return []
  }
}

// Fonction pour récupérer toutes les sélections
export async function getAllSelections(): Promise<UserSelection[]> {
  try {
    const data = await readData()
    return data.userSelections
  } catch (error) {
    console.error("Erreur lors de la récupération de toutes les sélections:", error)
    return []
  }
}
