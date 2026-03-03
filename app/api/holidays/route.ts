import { type NextRequest, NextResponse } from "next/server"
import { getAllHolidays, createHoliday, deleteHoliday } from "@/lib/prisma-utils"

// GET /api/holidays - Récupérer tous les jours fériés
export async function GET(request: NextRequest) {
  try {
    const holidays = await getAllHolidays()
    return NextResponse.json(holidays)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des jours fériés" }, { status: 500 })
  }
}

// POST /api/holidays - Créer un nouveau jour férié
export async function POST(request: NextRequest) {
  try {
    const { name, date, recurring } = await request.json()

    // Validation de base
    if (!name || !date) {
      return NextResponse.json({ message: "Nom et date sont requis" }, { status: 400 })
    }

    // Vérifier si un jour férié existe déjà à cette date
    const existingHolidays = await getAllHolidays()
    const existingHoliday = existingHolidays.find(
      (h) => new Date(h.date).toISOString().split("T")[0] === new Date(date).toISOString().split("T")[0],
    )

    if (existingHoliday) {
      return NextResponse.json({ message: "Un jour férié existe déjà à cette date" }, { status: 400 })
    }

    // Créer un nouveau jour férié
    const newHoliday = await createHoliday({
      name,
      date,
      recurring: recurring || false,
    })

    return NextResponse.json({ holiday: newHoliday }, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création du jour férié:", error)
    return NextResponse.json({ message: "Erreur lors de la création du jour férié" }, { status: 500 })
  }
}

// DELETE /api/holidays/:id - Supprimer un jour férié
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params
    await deleteHoliday(id)
    return NextResponse.json({ message: "Jour férié supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression du jour férié:", error)
    return NextResponse.json({ message: "Erreur lors de la suppression du jour férié" }, { status: 500 })
  }
}

// Fonction pour mettre à jour les repas de la semaine pour marquer un jour comme férié
async function updateWeeklyMealsForHoliday(holiday: any) {
  // Placeholder for future implementation if needed
}

// Fonction pour mettre à jour les repas de la semaine pour ne plus marquer un jour comme férié
async function removeHolidayFromWeeklyMeals(holiday: any) {
  // Placeholder for future implementation if needed
}
