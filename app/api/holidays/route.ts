import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type Holiday } from "@/lib/json-utils"

// GET /api/holidays - Récupérer tous les jours fériés
export async function GET(request: NextRequest) {
  try {
    const data = await readData()
    return NextResponse.json(data.holidays || [])
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

    const data = await readData()

    // Initialiser le tableau des jours fériés s'il n'existe pas
    if (!data.holidays) {
      data.holidays = []
    }

    // Vérifier si un jour férié existe déjà à cette date
    const existingHoliday = data.holidays.find(
      (h) => new Date(h.date).toISOString().split("T")[0] === new Date(date).toISOString().split("T")[0],
    )

    if (existingHoliday) {
      return NextResponse.json({ message: "Un jour férié existe déjà à cette date" }, { status: 400 })
    }

    // Créer un nouveau jour férié
    const newHoliday: Holiday = {
      id: `holiday_${Date.now()}`,
      name,
      date,
      recurring: recurring || false,
    }

    // Ajouter le jour férié
    data.holidays.push(newHoliday)
    await updateData("holidays", () => data.holidays || [])

    // Mettre à jour les repas de la semaine pour marquer ce jour comme férié
    await updateWeeklyMealsForHoliday(newHoliday)

    return NextResponse.json(newHoliday, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création du jour férié:", error)
    return NextResponse.json({ message: "Erreur lors de la création du jour férié" }, { status: 500 })
  }
}

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

// Fonction pour mettre à jour les repas de la semaine pour marquer un jour comme férié
async function updateWeeklyMealsForHoliday(holiday: Holiday) {
  const data = await readData()
  const holidayDate = new Date(holiday.date)

  // Pour chaque semaine stockée
  for (const weekOffset in data.weeklyMealsStorage) {
    const weekMeals = data.weeklyMealsStorage[weekOffset]
    let updated = false

    // Pour chaque jour de la semaine
    for (const day of weekMeals) {
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
        day.isHoliday = true
        day.holidayName = holiday.name
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

// Fonction pour mettre à jour les repas de la semaine pour ne plus marquer un jour comme férié
async function removeHolidayFromWeeklyMeals(holiday: Holiday) {
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
