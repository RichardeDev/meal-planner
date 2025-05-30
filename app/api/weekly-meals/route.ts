import { type NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { pool } from "@/lib/mysql-utils"

// Types
type Meal = {
  id: string
  name: string
  description: string
}

type DayMeals = {
  day: string
  date: string // ex: "5 mai"
  meals: Meal[]
  isHoliday?: boolean
  holidayName?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const weekOffsetStr = searchParams.get("weekOffset")
    const weekOffset = weekOffsetStr ? parseInt(weekOffsetStr) : 0

    const weekId = getWeekId(new Date(), weekOffset)

    // Récupérer les repas de la semaine depuis la base
    const [rows]: any = await pool.query("SELECT days FROM weekly_meals WHERE week_key = ?", [weekId])

    if (rows.length === 0) {
      // Si aucune donnée trouvée, générer des repas par défaut
      const defaultMeals = await getDefaultMeals()
      const defaultDays = generateDefaultWeeklyMeals(defaultMeals, weekOffset)
      return NextResponse.json(defaultDays)
    }

    // Parser les données stockées en JSON
    const storedDays = JSON.parse(rows[0].days)
    return NextResponse.json(storedDays)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des repas hebdomadaires:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dayId, mealId, weekOffset = 0 } = body

    if (!dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const weekId = getWeekId(new Date(), weekOffset)
    const meal = await getMealById(mealId)

    if (!meal) {
      return NextResponse.json({ error: "Repas non trouvé" }, { status: 404 })
    }

    const [rows]: any = await pool.query("SELECT * FROM weekly_meals WHERE week_key = ?", [weekId])
    let weekData = rows.length > 0 ? JSON.parse(rows[0].days) : generateDefaultWeeklyMeals([], weekOffset)

    const dayIndex = weekData.findIndex((d: DayMeals) => d.day === dayId)
    if (dayIndex === -1) {
      return NextResponse.json({ error: "Jour non trouvé" }, { status: 404 })
    }

    const existingMeal = weekData[dayIndex].meals.find((m: Meal) => m.id === mealId)
    if (existingMeal) {
      return NextResponse.json({ error: "Ce repas est déjà ajouté" }, { status: 409 })
    }

    weekData[dayIndex].meals.push(meal)

    // Mettre à jour ou insérer la semaine dans la base
    await updateWeeklyMealsInDB(weekId, weekData)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erreur lors de l'ajout du repas:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { dayId, oldMealId, newMealId, weekOffset = 0 } = body

    if (!dayId || !oldMealId || !newMealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const weekId = getWeekId(new Date(), weekOffset)
    const newMeal = await getMealById(newMealId)

    if (!newMeal) {
      return NextResponse.json({ error: "Nouveau repas non trouvé" }, { status: 404 })
    }

    const [rows]: any = await pool.query("SELECT * FROM weekly_meals WHERE week_key = ?", [weekId])
    if (rows.length === 0) {
      return NextResponse.json({ error: "Semaine non trouvée" }, { status: 404 })
    }

    let weekData = JSON.parse(rows[0].days)
    const dayIndex = weekData.findIndex((d: DayMeals) => d.day === dayId)
    if (dayIndex === -1) {
      return NextResponse.json({ error: "Jour non trouvé" }, { status: 404 })
    }

    const mealIndex = weekData[dayIndex].meals.findIndex((m: Meal) => m.id === oldMealId)
    if (mealIndex === -1) {
      return NextResponse.json({ error: "Ancien repas non trouvé" }, { status: 404 })
    }

    // Remplacer le repas
    weekData[dayIndex].meals[mealIndex] = newMeal
    await updateWeeklyMealsInDB(weekId, weekData)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du repas:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { dayId, mealId, weekOffset = 0 } = body

    if (!dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const weekId = getWeekId(new Date(), weekOffset)
    const [rows]: any = await pool.query("SELECT * FROM weekly_meals WHERE week_key = ?", [weekId])

    if (rows.length === 0) {
      return NextResponse.json({ error: "Semaine non trouvée" }, { status: 404 })
    }

    let weekData = JSON.parse(rows[0].days)
    const dayIndex = weekData.findIndex((d: DayMeals) => d.day === dayId)
    if (dayIndex === -1) {
      return NextResponse.json({ error: "Jour non trouvé" }, { status: 404 })
    }

    // Supprimer le repas
    weekData[dayIndex].meals = weekData[dayIndex].meals.filter((m: Meal) => m.id !== mealId)

    // Mettre à jour en base
    await updateWeeklyMealsInDB(weekId, weekData)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erreur lors de la suppression du repas:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}

function getWeekId(date: Date, weekOffset = 0): string {
  const adjustedDate = new Date(date)
  adjustedDate.setDate(adjustedDate.getDate() + weekOffset * 7)

  const year = adjustedDate.getFullYear()
  const month = adjustedDate.getMonth()
  const day = adjustedDate.getDate()

  const onejan = new Date(year, 0, 1)
  const weekNumber =
    Math.ceil((((adjustedDate.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7))
  return `${year}-W${String(weekNumber).padStart(2, "0")}`
}

async function getMealById(mealId: string): Promise<Meal | null> {
  const [rows]: any = await pool.query("SELECT * FROM meals WHERE id = ?", [mealId])
  return rows.length > 0 ? rows[0] : null
}

async function getDefaultMeals(): Promise<Meal[]> {
  const [rows]: any = await pool.query("SELECT * FROM meals")
  return rows.map((r: any) => ({ id: r.id, name: r.name, description: r.description }))
}

function generateDefaultWeeklyMeals(meals: Meal[], weekOffset = 0): DayMeals[] {
  const weekDates = getWeekDates(weekOffset)
  return weekDates.map((dayInfo) => ({
    day: dayInfo.day,
    date: dayInfo.date,
    meals: [...meals.slice(0, 3)], // Prendre les 3 premiers repas
  }))
}

async function updateWeeklyMealsInDB(weekKey: string, days: DayMeals[]) {
  const [result]: any = await pool.query(
    "REPLACE INTO weekly_meals (week_key, days) VALUES (?, ?)",
    [weekKey, JSON.stringify(days)]
  )
  return result.affectedRows > 0
}

function getWeekDates(weekOffset = 0): { day: string; date: string }[] {
  const today = new Date()
  const currentDay = today.getDay()
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
  const monday = new Date(today)
  monday.setDate(diff + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]
  return days.map((dayName, index) => {
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + index)
    return {
      day: dayName,
      date: dayDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
    }
  })
}