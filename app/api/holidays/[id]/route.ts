import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData } from "@/lib/json-utils"

// DELETE /api/holidays/:id - Supprimer un jour férié
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const data = await readData()

    if (!data.holidays) {
      return NextResponse.json({ message: "Jour férié non trouvé" }, { status: 404 })
    }

    const holidayIndex = data.holidays.findIndex((h) => h.id === id)
    if (holidayIndex === -1) {
      return NextResponse.json({ message: "Jour férié non trouvé" }, { status: 404 })
    }

    const holiday = data.holidays[holidayIndex]

    // Supprimer le jour férié
    data.holidays.splice(holidayIndex, 1)
    await updateData("holidays", () => data.holidays || [])

    // Mettre à jour les repas de la semaine pour ne plus marquer ce jour comme férié
    await removeHolidayFromWeeklyMeals(holiday)

    return NextResponse.json({ message: "Jour férié supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression du jour férié:", error)
    return NextResponse.json({ message: "Erreur lors de la suppression du jour férié" }, { status: 500 })
  }
}

// Fonction pour mettre à jour les repas de la semaine pour ne plus marquer un jour comme férié
async function removeHolidayFromWeeklyMeals(holiday: any) {
  const data = await readData()
  const holidayDate = new Date(holiday.date)

  // Pour chaque semaine stockée
  for (const weekOffset in data.weeklyMealsStorage) {
    const weekMeals = data.weeklyMealsStorage[weekOffset]
    let updated = false

    // Pour chaque jour de la semaine
    for (const day of weekMeals) {
      // Si ce jour était marqué comme ce jour férié spécifique
      if (day.isHoliday && day.holidayName === holiday.name) {
        // Convertir la date du jour (ex: "15 avril") en objet Date
        const [dayNum, monthName] = day.date.split(" ")

        // Mapper les noms de mois français vers leurs indices (0-11)
        const monthMap: Record<string, number> = {
          janvier: 0,
          février: 1,
          mars: 2,
          avril: 3,
          mai: 4,
          juin: 5,
          juillet: 6,
          août: 7,
          septembre: 8,
          octobre: 9,
          novembre: 10,
          décembre: 11,
        }

        // Créer une date pour ce jour
        const dayDate = new Date(holidayDate.getFullYear(), monthMap[monthName], Number.parseInt(dayNum))

        // Si c'est un jour férié récurrent, on compare seulement le jour et le mois
        const isHoliday = holiday.recurring
          ? dayDate.getDate() === holidayDate.getDate() && dayDate.getMonth() === holidayDate.getMonth()
          : dayDate.getDate() === holidayDate.getDate() &&
            dayDate.getMonth() === holidayDate.getMonth() &&
            dayDate.getFullYear() === holidayDate.getFullYear()

        if (isHoliday) {
          delete day.isHoliday
          delete day.holidayName
          updated = true
        }
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
