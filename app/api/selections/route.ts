import { type NextRequest, NextResponse } from "next/server"
import { getUserSelections, createOrUpdateUserSelection, getWeekKey, deleteUserSelection } from "@/lib/prisma-utils"

// GET /api/selections - Récupérer toutes les sélections
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const dayId = searchParams.get("dayId")
    const weekOffset = searchParams.get("weekOffset")

    console.log(`API Selections GET - userId: ${userId}, dayId: ${dayId}, weekOffset: ${weekOffset}`)

    const filters: any = {}

    // Filtrer par utilisateur si spécifié
    if (userId) {
      filters.userId = userId
    }

    // Filtrer par jour si spécifié
    if (dayId) {
      filters.dayId = dayId
    }

    // Filtrer par semaine si spécifié en utilisant la clé de semaine
    if (weekOffset !== null) {
      const weekOffsetNum = Number.parseInt(weekOffset)
      const targetWeekKey = getWeekKey(weekOffsetNum)
      filters.weekKey = targetWeekKey
    }

    const selections = await getUserSelections(filters)
    console.log(`Returning ${selections.length} selections`)
    return NextResponse.json(selections)
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des sélections" }, { status: 500 })
  }
}

// POST /api/selections - Créer ou mettre à jour une sélection
export async function POST(request: NextRequest) {
  try {
    const { userId, userName, dayId, mealId, weekOffset = 0 } = await request.json()

    console.log(
      `API Selections POST - userId: ${userId}, dayId: ${dayId}, mealId: ${mealId}, weekOffset: ${weekOffset}`,
    )

    if (!userId || !userName || !dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const weekKey = getWeekKey(weekOffset)
    const success = await createOrUpdateUserSelection({
      userId,
      userName,
      dayId,
      mealId,
      weekOffset,
      weekKey,
    })

    if (!success) {
      return NextResponse.json({ error: "Erreur lors de la sélection du repas" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la sélection du repas:", error)
    return NextResponse.json({ error: "Erreur lors de la sélection du repas" }, { status: 500 })
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const { userId, dayId, weekOffset = 0 } = await request.json()

    console.log(
      `API Selections DELETE - userId: ${userId}, dayId: ${dayId}, weekOffset: ${weekOffset}`
    )

    if (!userId || !dayId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const weekKey = getWeekKey(weekOffset)
    const success = await deleteUserSelection({ userId, dayId, weekKey })

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression de la sélection" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de la sélection:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}