import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type DayMeals } from "@/lib/json-utils"

// GET /api/weekly-meals?weekOffset=0 - Récupérer les repas pour une semaine spécifique
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const weekOffset = Number.parseInt(searchParams.get("weekOffset") || "0")

    const weeklyMeals = await getWeeklyMealsForWeek(weekOffset)
    return NextResponse.json(weeklyMeals)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des repas de la semaine" }, { status: 500 })
  }
}

// PUT /api/weekly-meals/update-meal - Mettre à jour un repas dans une semaine
export async function PUT(request: NextRequest) {
  try {
    const { dayId, oldMealId, newMealId, weekOffset = 0 } = await request.json()

    if (!dayId || !oldMealId || !newMealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const success = await updateMeal(dayId, oldMealId, newMealId, weekOffset)

    if (!success) {
      return NextResponse.json({ error: "Repas ou jour non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du repas" }, { status: 500 })
  }
}

// POST /api/weekly-meals/add-meal - Ajouter un repas à un jour
export async function POST(request: NextRequest) {
  try {
    const { dayId, mealId, weekOffset = 0 } = await request.json()

    if (!dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const success = await addMeal(dayId, mealId, weekOffset)

    if (!success) {
      return NextResponse.json({ error: "Repas ou jour non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de l'ajout du repas" }, { status: 500 })
  }
}

// DELETE /api/weekly-meals/remove-meal - Supprimer un repas d'un jour
export async function DELETE(request: NextRequest) {
  try {
    const { dayId, mealId, weekOffset = 0 } = await request.json()

    if (!dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const success = await removeMeal(dayId, mealId, weekOffset)

    if (!success) {
      return NextResponse.json({ error: "Repas ou jour non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression du repas" }, { status: 500 })
  }
}

// Fonction pour obtenir le numéro de semaine ISO d'une date
function getISOWeekNumber(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Jeudi de la semaine en cours
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  // Premier janvier de l'année
  const firstWeek = new Date(d.getFullYear(), 0, 4)
  // Ajuster au jeudi de la première semaine
  firstWeek.setDate(firstWeek.getDate() + 3 - ((firstWeek.getDay() + 6) % 7))
  // Calculer la différence en semaines
  const weekNumber =
    1 + Math.round(((d.getTime() - firstWeek.getTime()) / 86400000 - 3 + ((firstWeek.getDay() + 6) % 7)) / 7)
  return weekNumber
}

// Fonction pour obtenir l'année de la semaine ISO
function getISOWeekYear(date: Date): number {
  const d = new Date(date)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  return d.getFullYear()
}

// Fonction pour obtenir l'identifiant unique de la semaine (année-semaine)
function getWeekId(weekOffset = 0): string {
  const today = new Date()
  today.setDate(today.getDate() + weekOffset * 7)
  const weekNumber = getISOWeekNumber(today)
  const weekYear = getISOWeekYear(today)
  return `${weekYear}-${weekNumber}`
}

const getWeekDates = (weekOffset = 0) => {
  const today = new Date()

  // Trouver le lundi de la semaine actuelle
  const currentDay = today.getDay() // 0 = dimanche, 1 = lundi, etc.
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) // Ajuster quand le jour est dimanche

  // Créer une nouvelle date pour le lundi de la semaine demandée
  const monday = new Date(today)
  monday.setDate(diff + weekOffset * 7)

  // Réinitialiser les heures pour éviter les problèmes de fuseau horaire
  monday.setHours(0, 0, 0, 0)

  // Générer les dates pour chaque jour de la semaine (lundi à vendredi)
  const weekDays = [
    { name: "Lundi", date: new Date(monday) },
    { name: "Mardi", date: new Date(monday.getTime() + 86400000) }, // +1 jour en millisecondes
    { name: "Mercredi", date: new Date(monday.getTime() + 86400000 * 2) }, // +2 jours
    { name: "Jeudi", date: new Date(monday.getTime() + 86400000 * 3) }, // +3 jours
    { name: "Vendredi", date: new Date(monday.getTime() + 86400000 * 4) }, // +4 jours
  ]

  // Formater les dates pour l'affichage
  return weekDays.map((day) => ({
    day: day.name,
    date: day.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
  }))
}

// Generate weekly meals for a specific week
async function generateWeeklyMeals(weekOffset = 0): Promise<DayMeals[]> {
  const weekDates = getWeekDates(weekOffset)
  const data = await readData()
  const meals = data.meals

  // Use a deterministic approach instead of random
  return weekDates.map((dayInfo, dayIndex) => {
    // Select meals based on day index instead of random
    const startIndex = (dayIndex * 2) % meals.length
    const dayMeals = [
      meals[startIndex % meals.length],
      meals[(startIndex + 1) % meals.length],
      meals[(startIndex + 2) % meals.length],
    ]

    return {
      day: dayInfo.day,
      date: dayInfo.date,
      meals: dayMeals,
    }
  })
}

// Get weekly meals for a specific week
async function getWeeklyMealsForWeek(weekOffset = 0): Promise<DayMeals[]> {
  const data = await readData()
  // Utiliser l'identifiant unique de la semaine au lieu de weekOffset
  const weekId = getWeekId(weekOffset)

  // If we already have data for this week, return it
  if (data.weeklyMealsStorage[weekId]) {
    return data.weeklyMealsStorage[weekId]
  }

  // Otherwise, generate new data
  const newWeeklyMeals = await generateWeeklyMeals(weekOffset)

  // Save to storage
  await updateData("weeklyMealsStorage", (storage) => {
    return {
      ...storage,
      [weekId]: newWeeklyMeals,
    }
  })

  return newWeeklyMeals
}

// Update a meal in a specific week
async function updateMeal(
  dayId: string,
  oldMealId: string,
  newMealId: string,
  weekOffset = 0,
): Promise<boolean> {
  const data = await readData()
  // Utiliser l'identifiant unique de la semaine
  const weekId = getWeekId(weekOffset)

  // Get the meals for the specified week
  let weekMeals = data.weeklyMealsStorage[weekId]
  if (!weekMeals) {
    weekMeals = await getWeeklyMealsForWeek(weekOffset)
  }

  // Find the day
  const dayIndex = weekMeals.findIndex((day) => day.day === dayId)
  if (dayIndex === -1) return false

  // Find the meal in that day
  const mealIndex = weekMeals[dayIndex].meals.findIndex((meal) => meal.id === oldMealId)
  if (mealIndex === -1) return false

  // Find the new meal
  const newMeal = data.meals.find((meal) => meal.id === newMealId)
  if (!newMeal) return false

  // Update the meal
  weekMeals[dayIndex].meals[mealIndex] = newMeal

  // Update the storage
  await updateData("weeklyMealsStorage", (storage) => {
    return {
      ...storage,
      [weekId]: weekMeals,
    }
  })

  // Update any user selections that had the old meal
  await updateData("userSelections", (selections) => {
    return selections.map((selection) => {
      if (selection.dayId === dayId && selection.mealId === oldMealId) {
        return { ...selection, mealId: newMealId }
      }
      return selection
    })
  })

  return true
}

// Add a meal to a day in a specific week
async function addMeal(dayId: string, mealId: string, weekOffset = 0): Promise<boolean> {
  const data = await readData()
  // Utiliser l'identifiant unique de la semaine
  const weekId = getWeekId(weekOffset)

  // Get the meals for the specified week
  let weekMeals = data.weeklyMealsStorage[weekId]
  if (!weekMeals) {
    weekMeals = await getWeeklyMealsForWeek(weekOffset)
  }

  // Find the day
  const dayIndex = weekMeals.findIndex((day) => day.day === dayId)
  if (dayIndex === -1) return false

  // Find the meal
  const meal = data.meals.find((meal) => meal.id === mealId)
  if (!meal) return false

  // Add the meal to that day
  weekMeals[dayIndex].meals.push(meal)

  // Update the storage
  await updateData("weeklyMealsStorage", (storage) => {
    return {
      ...storage,
      [weekId]: weekMeals,
    }
  })

  return true
}

// Remove a meal from a day in a specific week
async function removeMeal(dayId: string, mealId: string, weekOffset = 0): Promise<boolean> {
  const data = await readData()
  // Utiliser l'identifiant unique de la semaine
  const weekId = getWeekId(weekOffset)

  // Get the meals for the specified week
  let weekMeals = data.weeklyMealsStorage[weekId]
  if (!weekMeals) {
    weekMeals = await getWeeklyMealsForWeek(weekOffset)
  }

  // Find the day
  const dayIndex = weekMeals.findIndex((day) => day.day === dayId)
  if (dayIndex === -1) return false

  // Remove the meal from that day
  weekMeals[dayIndex].meals = weekMeals[dayIndex].meals.filter((meal) => meal.id !== mealId)

  // Update the storage
  await updateData("weeklyMealsStorage", (storage) => {
    return {
      ...storage,
      [weekId]: weekMeals,
    }
  })

  // Remove any user selections for this meal
  await updateData("userSelections", (selections) => {
    return selections.filter((selection) => !(selection.dayId === dayId && selection.mealId === mealId))
  })

  return true
}
