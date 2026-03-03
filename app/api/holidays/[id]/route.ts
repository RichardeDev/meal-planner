import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData } from "@/lib/json-utils"
import { deleteHoliday } from "@/lib/prisma-utils"

// DELETE /api/holidays/:id - Supprimer un jour férié
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params

    const isDeleted = await deleteHoliday(id)

    if (!isDeleted) {
      return NextResponse.json({ message: "Jour férié non trouvé" }, { status: 404 })
    }

    const data = await readData()

    // Mettre à jour les repas de la semaine pour ne plus marquer ce jour comme férié
    await removeHolidayFromWeeklyMeals(data, id)

    return NextResponse.json({ success: true, message: "Jour férié supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression du jour férié:", error)
    return NextResponse.json(
      { success: false, message: "Erreur lors de la suppression du jour férié" },
      { status: 500 },
    )
  }
}

// Fonction pour mettre à jour les repas de la semaine pour ne plus marquer un jour comme férié
async function removeHolidayFromWeeklyMeals(data: any, holidayId: string) {
  const holiday = data.holidays.find((h: any) => h.id === holidayId)
  if (!holiday) return

  const holidayDate = new Date(holiday.date)

  // Pour chaque semaine stockée
  for (const weekOffset in data.weeklyMealsStorage) {
    const weekMeals = data.weeklyMealsStorage[weekOffset]
    let updated = false

    // Pour chaque jour de la semaine
    for (const day of weekMeals) {
      // Si ce jour était marqué comme ce jour férié spécifique
      if (day.isHoliday && day.holidayId === holidayId) {
        delete day.isHoliday
        delete day.holidayId
        updated = true
      }
    }

    // Si des modifications ont été apportées, mettre à jour le stockage
    if (updated) {
      data.weeklyMealsStorage[weekOffset] = weekMeals
    }
  }

  // Enregistrer les modifications
  await updateData("weeklyMealsStorage", () => data.weeklyMealsStorage)
}
