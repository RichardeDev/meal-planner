import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type DayMeals } from "@/lib/json-utils"
import { getWeekNumber } from "@/lib/utils"

// GET /api/weekly-meals?weekOffset=0 - Récupérer les repas pour une semaine spécifique
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const weekNumber = Number.parseInt(searchParams.get("weekNumber") || "0")
    if (!weekNumber || isNaN(weekNumber)) {
      const today = new Date()
      const weekNumberToday = getWeekNumber(today)
      const weeklyMeals = await getWeeklyMealsForWeek(weekNumberToday)
      return NextResponse.json(weeklyMeals)
    }

    const weeklyMeals = await getWeeklyMealsForWeek(weekNumber)
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

// Generate dates for a specific week
const getWeekDates = (weekOffset = 0) => {
  const today = new Date()
  const day = today.getDay() // 0 is Sunday, 1 is Monday, etc.
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday

  const monday = new Date(today)
  monday.setDate(diff + weekOffset * 7)

  const weekDays = [
    { name: "Lundi", date: new Date(monday) },
    { name: "Mardi", date: new Date(new Date(monday).setDate(monday.getDate() + 1)) },
    { name: "Mercredi", date: new Date(new Date(monday).setDate(monday.getDate() + 2)) },
    { name: "Jeudi", date: new Date(new Date(monday).setDate(monday.getDate() + 3)) },
    { name: "Vendredi", date: new Date(new Date(monday).setDate(monday.getDate() + 4)) },
  ]

  return weekDays.map((day) => ({
    day: day.name,
    date: day.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
  }))
}

export const getWeekDatesWithYearAndNumber = (weekOffset = 0) => {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 1 ? 0 : day === 0 ? -6 : 1)

  const monday = new Date(today)
  monday.setDate(diff + weekOffset * 7)

  const weekDays = []
  for (let i = 0; i < 5; i++) {
    const currentDate = new Date(monday)
    currentDate.setDate(monday.getDate() + i)
    weekDays.push({
      name: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"][i],
      date: currentDate,
    })
  }

  const weekNumber = getWeekNumber(weekDays[0].date)
  const year = weekDays[0].date.getFullYear()

  return {
    weekDays: weekDays.map(w => ({
      day: w.name,
      date: w.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
    })),
    weekNumber,
    year
  }
}

// Generate weekly meals for a specific week
// export async function generateWeeklyMeals(weekOffset = 0): Promise<DayMeals[]> {
//   const weekDates = getWeekDates(weekOffset)
//   const data = await readData()
//   const meals = data.meals

//   // Use a deterministic approach instead of random
//   return weekDates.map((dayInfo, dayIndex) => {
//     // Select meals based on day index instead of random
//     const startIndex = (dayIndex * 2) % meals.length
//     const dayMeals = [
//       meals[startIndex % meals.length],
//       meals[(startIndex + 1) % meals.length],
//       meals[(startIndex + 2) % meals.length],
//     ]

//     return {
//       day: dayInfo.day,
//       date: dayInfo.date,
//       meals: dayMeals,
//     }
//   })
// }

export async function generateWeeklyMeals(weekOffset = 0): Promise<DayMeals[]> {
  const { weekDays } = getWeekDatesWithYearAndNumber(weekOffset)
  const data = await readData()
  const meals = data.meals

  return weekDays.map((dayInfo, index) => {
    const startIndex = (index * 2) % meals.length
    const mealCount = 3
    const dayMeals = []

    for (let i = 0; i < mealCount; i++) {
      dayMeals.push(meals[(startIndex + i) % meals.length])
    }

    return {
      day: dayInfo.day,
      date: dayInfo.date,
      meals: dayMeals,
    }
  })
}

// Get weekly meals for a specific week
// export async function getWeeklyMealsForWeek(weekOffset = 0): Promise<DayMeals[]> {
//   const data = await readData()
//   const weekOffsetStr = weekOffset.toString()

//   // If we already have data for this week, return it
//   if (data.weeklyMealsStorage[weekOffsetStr]) {
//     return data.weeklyMealsStorage[weekOffsetStr]
//   }

//   // Otherwise, generate new data
//   const newWeeklyMeals = await generateWeeklyMeals(weekOffset)

//   // Save to storage
//   await updateData("weeklyMealsStorage", (storage) => {
//     return {
//       ...storage,
//       [weekOffsetStr]: newWeeklyMeals,
//     }
//   })

//   return newWeeklyMeals
// }
export async function getWeeklyMealsForWeek(weekOffset = 0): Promise<DayMeals[]> {
  const { weekNumber, year } = getWeekDatesWithYearAndNumber(weekOffset)
  const key = `${year}-W${String(weekNumber).padStart(2, '0')}` // ex: "2025-W18"

  const data = await readData()

  if (data.weeklyMealsStorage[key]) {
    return data.weeklyMealsStorage[key]
  }

  const newWeeklyMeals = await generateWeeklyMeals(weekOffset)

  await updateData("weeklyMealsStorage", (storage) => ({
    ...storage,
    [key]: newWeeklyMeals,
  }))

  return newWeeklyMeals
}

// Update a meal in a specific week
export async function updateMeal(
  dayId: string,
  oldMealId: string,
  newMealId: string,
  weekOffset = 0,
): Promise<boolean> {
  const data = await readData()
  const weekOffsetStr = weekOffset.toString()

  // Get the meals for the specified week
  let weekMeals = data.weeklyMealsStorage[weekOffsetStr]
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
      [weekOffsetStr]: weekMeals,
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
export async function addMeal(dayId: string, mealId: string, weekOffset = 0): Promise<boolean> {
  const data = await readData()
  const weekOffsetStr = weekOffset.toString()

  // Get the meals for the specified week
  let weekMeals = data.weeklyMealsStorage[weekOffsetStr]
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
      [weekOffsetStr]: weekMeals,
    }
  })

  return true
}

// Remove a meal from a day in a specific week
export async function removeMeal(dayId: string, mealId: string, weekOffset = 0): Promise<boolean> {
  const data = await readData()
  const weekOffsetStr = weekOffset.toString()

  // Get the meals for the specified week
  let weekMeals = data.weeklyMealsStorage[weekOffsetStr]
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
      [weekOffsetStr]: weekMeals,
    }
  })

  // Remove any user selections for this meal
  await updateData("userSelections", (selections) => {
    return selections.filter((selection) => !(selection.dayId === dayId && selection.mealId === mealId))
  })

  return true
}
