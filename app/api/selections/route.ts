import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type UserSelection } from "@/lib/json-utils"
// Fonction pour générer une clé de semaine unique (année-semaine)
const getWeekKey = (weekOffset: number): string => {
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)

  monday.setDate(diff + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  // Calculer le numéro de semaine dans l'année
  const startOfYear = new Date(monday.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

  return `${monday.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`
}
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
      const targetWeekKey = getWeekKey(weekOffsetNum)
        selections = selections.filter((selection) =>{
          // Pour la compatibilité avec les anciennes données qui n'ont pas de weekKey
          const selectionWeekKey = selection.weekKey || getWeekKey(selection.weekOffset || 0)
          return selectionWeekKey === targetWeekKey
      })
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
async function selectMeal(
  userId: string,
  userName: string,
  dayId: string,
  mealId: string,
  weekOffset = 0,
): Promise<boolean> {
  try {
    const weekKey = getWeekKey(weekOffset)
    console.log(
      `selectMeal - userId: ${userId}, dayId: ${dayId}, mealId: ${mealId}, weekOffset: ${weekOffset}, weekKey: ${weekKey}`,
    )
    await updateData("userSelections", (selections) => {
      // Check if user already has a selection for this day and week
      const existingSelectionIndex = selections.findIndex((selection) => {
        const selectionWeekKey = selection.weekKey || getWeekKey(selection.weekOffset || 0)
        return selection.userId === userId && selection.dayId === dayId && selectionWeekKey === weekKey
      })

      if (existingSelectionIndex !== -1) {
        // Update existing selection
        selections[existingSelectionIndex].mealId = mealId
        // Ensure weekOffset is set
        selections[existingSelectionIndex].weekOffset = weekOffset
        selections[existingSelectionIndex].weekKey = weekKey
      } else {
        // Add new selection
        const newSelection = { userId, userName, dayId, mealId, weekOffset, weekKey }
        selections.push(newSelection)
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
async function getUserSelectionsForWeek(userId: string, weekOffset = 0): Promise<UserSelection[]> {
  try {
    const data = await readData()
    const targetWeekKey = getWeekKey(weekOffset)

    return data.userSelections.filter((selection) => {
      const selectionWeekKey = selection.weekKey || getWeekKey(selection.weekOffset || 0)
      return selection.userId === userId && selectionWeekKey === targetWeekKey
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections de l'utilisateur:", error)
    return []
  }
}

// Fonction pour récupérer les sélections pour un jour d'une semaine spécifique
async function getMealSelectionsForDayAndWeek(dayId: string, weekOffset = 0): Promise<UserSelection[]> {
  try {
    const data = await readData()
    const targetWeekKey = getWeekKey(weekOffset)

    return data.userSelections.filter((selection) => {
      const selectionWeekKey = selection.weekKey || getWeekKey(selection.weekOffset || 0)
      return selection.dayId === dayId && selectionWeekKey === targetWeekKey
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections pour le jour:", error)
    return []
  }
}

// Fonction pour récupérer toutes les sélections pour une semaine spécifique
async function getAllSelectionsForWeek(weekOffset = 0): Promise<UserSelection[]> {
  try {
    const data = await readData()
    const targetWeekKey = getWeekKey(weekOffset)

    return data.userSelections.filter((selection) => {
      const selectionWeekKey = selection.weekKey || getWeekKey(selection.weekOffset || 0)
      return selectionWeekKey === targetWeekKey
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de toutes les sélections:", error)
    return []
  }
}
