import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/mysql-utils"

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

/**
 * Fonction pour mettre à jour les repas de la semaine pour ne plus marquer ce jour comme férié
 */
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