import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type Holiday } from "@/lib/json-utils"
import { pool } from "@/lib/mysql-utils"

// GET /api/holidays - Récupérer tous les jours fériés
export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.query("SELECT * FROM holidays")
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erreur lors de la récupération des jours fériés:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}

// POST /api/holidays - Créer un nouveau jour férié
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, date, recurring } = body

    if (!name || !date) {
      return NextResponse.json({ error: "Nom et date sont requis" }, { status: 400 })
    }

    const holidayDate = new Date(date)

    // Vérifier si un jour férié existe déjà à cette date
    const [existingHolidays]: any = await pool.query(
      "SELECT * FROM holidays WHERE DATE(date) = ?",
      [holidayDate.toISOString().split("T")[0]]
    )

    if (existingHolidays.length > 0) {
      return NextResponse.json({ error: "Un jour férié existe déjà à cette date" }, { status: 400 })
    }

    // Créer le jour férié dans la base de données
    const id = `holiday_${Date.now()}`
    await pool.query(
      "INSERT INTO holidays (id, name, date, recurring) VALUES (?, ?, ?, ?)",
      [id, name, holidayDate.toISOString().split("T")[0], !!recurring]
    )

    // Marquer ce jour comme férié dans les repas hebdomadaires
    await updateWeeklyMealsForHoliday(id, name, holidayDate.toISOString(), !!recurring)

    return NextResponse.json(
      {
        id,
        name,
        date: holidayDate.toISOString().split("T")[0],
        recurring: !!recurring,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Erreur lors de la création du jour férié:", error.message)
    return NextResponse.json(
      { error: "Erreur lors de la création du jour férié", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/holidays/:id - Supprimer un jour férié
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params

    // Récupérer le jour férié avant suppression
    const [rows]: any = await pool.query("SELECT * FROM holidays WHERE id = ?", [id])

    if (rows.length === 0) {
      return NextResponse.json({ message: "Jour férié non trouvé" }, { status: 404 })
    }

    const holiday = rows[0]

    // Supprimer le jour férié
    await pool.query("DELETE FROM holidays WHERE id = ?", [id])

    // Retirer le flag isHoliday dans les repas
    await removeHolidayFromWeeklyMeals(id, holiday.name, holiday.date)

    return NextResponse.json({ message: "Jour férié supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression du jour férié:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

// Fonction pour mettre à jour les repas de la semaine pour marquer un jour comme férié
async function updateWeeklyMealsForHoliday(holidayId: string, holidayName: string, holidayDateStr: string, recurring: boolean) {
  const holidayDate = new Date(holidayDateStr)
  const formattedDate = holidayDate.toISOString().split("T")[0] // YYYY-MM-DD

  try {
    const [weeks]: any = await pool.query("SELECT week_key, days FROM weekly_meals")

    for (const weekRow of weeks) {
      const weekKey = weekRow.week_key
      let days = JSON.parse(weekRow.days)

      let updated = false

      for (const day of days) {
        // Convertir la date du jour (ex: "7 avril") en objet Date
        const [dayNum, monthName] = day.date.split(" ")
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

        const dayDate = new Date(holidayDate.getFullYear(), monthMap[monthName], parseInt(dayNum))

        const isHoliday = recurring
          ? dayDate.getDate() === holidayDate.getDate() && dayDate.getMonth() === holidayDate.getMonth()
          : dayDate.toISOString().split("T")[0] === formattedDate

        if (isHoliday) {
          day.isHoliday = true
          day.holidayName = holidayName
          updated = true
        }
      }

      if (updated) {
        await pool.query("UPDATE weekly_meals SET days = ? WHERE week_key = ?", [
          JSON.stringify(days),
          weekKey,
        ])
      }
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des repas avec jour férié:", error)
  }
}

// Fonction pour mettre à jour les repas de la semaine pour ne plus marquer un jour comme férié
async function removeHolidayFromWeeklyMeals(holidayId: string, holidayName: string, holidayDateStr: string) {
  const holidayDate = new Date(holidayDateStr)

  try {
    const [weeks]: any = await pool.query("SELECT week_key, days FROM weekly_meals")

    for (const weekRow of weeks) {
      let days = JSON.parse(weekRow.days)
      let updated = false

      for (const day of days) {
        if (day.isHoliday && day.holidayName === holidayName) {
          const [dayNum, monthName] = day.date.split(" ")
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

          const dayDate = new Date(holidayDate.getFullYear(), monthMap[monthName], parseInt(dayNum))
          const isHoliday = dayDate.toISOString().split("T")[0] === holidayDate.toISOString().split("T")[0]

          if (isHoliday) {
            delete day.isHoliday
            delete day.holidayName
            updated = true
          }
        }
      }

      if (updated) {
        await pool.query("UPDATE weekly_meals SET days = ? WHERE week_key = ?", [
          JSON.stringify(days),
          weekRow.week_key,
        ])
      }
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des repas:", error)
  }
}