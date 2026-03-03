import { PrismaClient } from "@prisma/client"
import type { Role, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

// Types pour les fonctions utilitaires
export interface User {
  id: string
  name: string
  email: string
  password: string
  role: string
}

export interface PendingUser {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

export interface Meal {
  id: string
  name: string
  description: string
}

export interface Holiday {
  id: string
  name: string
  date: string
  recurring: boolean
}

export interface UserSelection {
  userId: string
  userName: string
  dayId: string
  mealId: string
  weekOffset?: number
  weekKey?: string
}

export interface DayMeals {
  day: string
  date: string
  meals: Meal[]
  isHoliday?: boolean
  holidayName?: string
}

// Fonctions pour les utilisateurs
export async function getAllUsers(): Promise<User[]> {
  const users = await prisma.user.findMany()
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  }))
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: id },
  })

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  }
}

export async function createUser(userData: Omit<User, "id">): Promise<User> {
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role as Role,
    },
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  }
}

export async function updateUser(id: string, userData: Partial<Omit<User, "id">>): Promise<User | null> {
  try {
    const updateData: any = {}

    if (userData.name) updateData.name = userData.name
    if (userData.email) updateData.email = userData.email
    if (userData.password) updateData.password = userData.password
    if (userData.role) updateData.role = userData.role as Role

    const user = await prisma.user.update({
      where: { id: id },
      data: updateData,
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    }
  } catch (error) {
    return null
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await prisma.user.delete({
      where: { id: id },
    })
    return true
  } catch (error) {
    return false
  }
}

// Fonctions pour les utilisateurs en attente
export async function getAllPendingUsers(): Promise<PendingUser[]> {
  const pendingUsers = await prisma.pendingUser.findMany()
  return pendingUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: user.createdAt.toISOString(),
  }))
}

export async function createPendingUser(userData: Omit<PendingUser, "id" | "createdAt">): Promise<PendingUser> {
  const pendingUser = await prisma.pendingUser.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    },
  })

  return {
    id: pendingUser.id,
    name: pendingUser.name,
    email: pendingUser.email,
    password: pendingUser.password,
    createdAt: pendingUser.createdAt.toISOString(),
  }
}

export async function getPendingUserById(id: string): Promise<PendingUser | null> {
  const pendingUser = await prisma.pendingUser.findUnique({
    where: { id: id },
  })

  if (!pendingUser) return null

  return {
    id: pendingUser.id,
    name: pendingUser.name,
    email: pendingUser.email,
    password: pendingUser.password,
    createdAt: pendingUser.createdAt.toISOString(),
  }
}

export async function deletePendingUser(id: string): Promise<boolean> {
  try {
    await prisma.pendingUser.delete({
      where: { id: id },
    })
    return true
  } catch (error) {
    return false
  }
}

// Fonctions pour les repas
export async function getAllMeals(): Promise<Meal[]> {
  const meals = await prisma.meal.findMany()
  return meals.map((meal) => ({
    id: meal.id,
    name: meal.name,
    description: meal.description,
  }))
}

export async function getMealById(id: string): Promise<Meal | null> {
  const meal = await prisma.meal.findUnique({
    where: { id: id },
  })

  if (!meal) return null

  return {
    id: meal.id,
    name: meal.name,
    description: meal.description,
  }
}

export async function createMeal(mealData: Omit<Meal, "id">): Promise<Meal> {
  const meal = await prisma.meal.create({
    data: {
      name: mealData.name,
      description: mealData.description,
    },
  })

  return {
    id: meal.id,
    name: meal.name,
    description: meal.description,
  }
}

export async function updateMeal(id: string, mealData: Partial<Omit<Meal, "id">>): Promise<Meal | null> {
  try {
    const meal = await prisma.meal.update({
      where: { id: id },
      data: mealData,
    })

    return {
      id: meal.id,
      name: meal.name,
      description: meal.description,
    }
  } catch (error) {
    return null
  }
}


export async function deleteMeal(mealId: string): Promise<boolean> {
  try {
    const allWeeks = (await getWeeklyMeals()) as Record<string, DayMeals[]>

    let isUsed = false

    Object.values(allWeeks).forEach((weekMeals) => {
      weekMeals.forEach((day) => {
        if (day.meals.some((meal) => meal.id === mealId)) {
          isUsed = true
        }
      })
    })

    if (isUsed) {
      return true 
    }

    await prisma.meal.delete({
      where: { id: mealId },
    })

    await prisma.userSelection.deleteMany({
      where: { mealId },
    })

    return false 
  } catch (error) {
    console.error("Erreur lors de la suppression du repas:", error)
    throw new Error("Impossible de supprimer le repas")
  }
}

// Fonctions pour les jours fériés
export async function getAllHolidays(): Promise<Holiday[]> {
  const holidays = await prisma.holiday.findMany()
  return holidays.map((holiday) => ({
    id: holiday.id,
    name: holiday.name,
    date: holiday.date.toISOString(),
    recurring: holiday.recurring,
  }))
}

export async function createHoliday(holidayData: Omit<Holiday, "id">): Promise<Holiday> {
  const holiday = await prisma.holiday.create({
    data: {
      name: holidayData.name,
      date: new Date(holidayData.date),
      recurring: holidayData.recurring,
    },
  })

  return {
    id: holiday.id,
    name: holiday.name,
    date: holiday.date.toISOString(),
    recurring: holiday.recurring,
  }
}

export async function deleteHoliday(id: string): Promise<boolean> {
  try {
    await prisma.holiday.delete({
      where: { id: id },
    })
    return true
  } catch (error) {
    return false
  }
}

// Fonctions pour les sélections utilisateur
export async function getUserSelections(filters: {
  userId?: string
  dayId?: string
  weekKey?: string
}): Promise<UserSelection[]> {
  const where: any = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.dayId) where.dayId = filters.dayId
  if (filters.weekKey) where.weekKey = filters.weekKey

  const selections = await prisma.userSelection.findMany({
    where,
    include: {
      user: true,
      meal: true,
    },
  })

  return selections.map((selection) => ({
    userId: selection.userId,
    userName: selection.userName,
    dayId: selection.dayId,
    mealId: selection.mealId,
    weekOffset: selection.weekOffset || 0,
    weekKey: selection.weekKey || "",
  }))
}

export async function createOrUpdateUserSelection(selectionData: UserSelection): Promise<boolean> {
  try {
    await prisma.userSelection.upsert({
      where: {
        userId_dayId_weekKey: {
          userId: selectionData.userId,
          dayId: selectionData.dayId,
          weekKey: selectionData.weekKey || "",
        },
      },
      update: {
        mealId: selectionData.mealId,
        weekOffset: selectionData.weekOffset || 0,
        userName: selectionData.userName,
      },
      create: {
        userId: selectionData.userId,
        userName: selectionData.userName,
        dayId: selectionData.dayId,
        mealId: selectionData.mealId,
        weekOffset: selectionData.weekOffset || 0,
        weekKey: selectionData.weekKey || "",
      },
    })
    return true
  } catch (error) {
    console.error("Erreur lors de la création/mise à jour de la sélection:", error)
    return false
  }
}

export async function deleteUserSelection(filters: {
  userId: string
  dayId: string
  weekKey: string
}): Promise<boolean> {
  try {
    const { userId, dayId, weekKey } = filters

    if (!userId || !dayId || !weekKey) {
      console.error("Tous les filtres (userId, dayId, weekKey) sont requis")
      return false
    }

    const result = await prisma.userSelection.deleteMany({
      where: { userId, dayId, weekKey },
    })

    return result.count > 0
  } catch (error: any) {
    if (error.code === "P2025") {
      // Aucun enregistrement trouvé à supprimer
      return false
    }
    console.error("Erreur lors de la suppression de la sélection:", error)
    return false
  }
}

export async function deleteAllUserSelections(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      console.error("L'ID de l'utilisateur est requis")
      return false
    }

    const result = await prisma.userSelection.deleteMany({
      where: {
        userId,
      },
    })

    console.log(`Supprimé ${result.count} sélection(s) pour l'utilisateur ${userId}`)
    return result.count > 0
  } catch (error) {
    console.error("Erreur lors de la suppression des sélections de l'utilisateur:", error)
    return false
  }
}

// Fonctions pour les repas hebdomadaires
export async function getWeeklyMeals(weekKey?: string): Promise<DayMeals[] | Record<string, DayMeals[]>> {
  if (weekKey) {
    const weeklyMealsStorage = await prisma.weeklyMealsStorage.findUnique({
      where: { weekKey },
    })

    if (!weeklyMealsStorage || !weeklyMealsStorage.data) {
      return []
    }

    return weeklyMealsStorage.data as unknown as DayMeals[]
  } else {
    const allWeeks = await prisma.weeklyMealsStorage.findMany()

    const result: Record<string, DayMeals[]> = {}
    allWeeks.forEach((item) => {
      result[item.weekKey] = item.data as unknown as DayMeals[]
    })

    return result
  }
}

export async function createWeeklyMeals(weekKey: string, weekData: DayMeals[]): Promise<boolean> {
  try {
    await prisma.weeklyMealsStorage.upsert({
      where: { weekKey },
      update: { data: weekData as unknown as Prisma.InputJsonValue }, // Cast vers JsonValue
      create: {
        weekKey,
        data: weekData as unknown as Prisma.InputJsonValue, // Cast vers JsonValue
      },
    })
    return true
  } catch (error) {
    console.error("Erreur lors de la création des repas hebdomadaires:", error)
    return false
  }
}

export async function updateWeeklyMeal(
  weekKey: string,
  dayId: string,
  oldMealId: string,
  newMealId: string,
): Promise<boolean> {
  try {
    const weeklyMealsStorage = await prisma.weeklyMealsStorage.findUnique({
      where: { weekKey },
    })

    if (!weeklyMealsStorage || !weeklyMealsStorage.data) {
      return false
    }

    const weekData = weeklyMealsStorage.data as unknown as DayMeals[]
    const dayIndex = weekData.findIndex((day) => day.day === dayId)

    if (dayIndex === -1) return false

    const mealIndex = weekData[dayIndex].meals.findIndex((meal) => meal.id === oldMealId)

    if (mealIndex === -1) return false

    // Récupérer les informations du nouveau repas
    const newMeal = await getMealById(newMealId)
    if (!newMeal) return false

    weekData[dayIndex].meals[mealIndex] = newMeal

    await prisma.weeklyMealsStorage.update({
      where: { weekKey },
      data: { data: weekData as unknown as Prisma.InputJsonValue }, // Cast vers JsonValue
    })

    return true
  } catch (error) {
    console.error("Erreur lors de la mise à jour du repas hebdomadaire:", error)
    return false
  }
}

export async function addMealToWeeklyDay(weekKey: string, dayId: string, mealId: string): Promise<boolean> {
  try {
    const weeklyMealsStorage = await prisma.weeklyMealsStorage.findUnique({
      where: { weekKey },
    })

    if (!weeklyMealsStorage || !weeklyMealsStorage.data) {
      return false
    }

    const weekData = weeklyMealsStorage.data as unknown as DayMeals[]
    const dayIndex = weekData.findIndex((day) => day.day === dayId)

    if (dayIndex === -1) return false

    // Récupérer les informations du repas
    const meal = await getMealById(mealId)
    if (!meal) return false

    // Vérifier si le repas n'est pas déjà présent
    const mealExists = weekData[dayIndex].meals.some((m) => m.id === mealId)
    if (mealExists) return false

    weekData[dayIndex].meals.push(meal)

    await prisma.weeklyMealsStorage.update({
      where: { weekKey },
      data: { data: weekData as unknown as Prisma.InputJsonValue }, // Cast vers JsonValue
    })

    return true
  } catch (error) {
    console.error("Erreur lors de l'ajout du repas:", error)
    return false
  }
}

export async function removeMealFromWeeklyDay(weekKey: string, dayId: string, mealId: string): Promise<boolean> {
  try {
    const weeklyMealsStorage = await prisma.weeklyMealsStorage.findUnique({
      where: { weekKey },
    })

    if (!weeklyMealsStorage || !weeklyMealsStorage.data) {
      return false
    }

    const weekData = weeklyMealsStorage.data as unknown as DayMeals[]
    const dayIndex = weekData.findIndex((day) => day.day === dayId)

    if (dayIndex === -1) return false

    const mealIndex = weekData[dayIndex].meals.findIndex((meal) => meal.id === mealId)

    if (mealIndex === -1) return false

    weekData[dayIndex].meals.splice(mealIndex, 1)

    await prisma.weeklyMealsStorage.update({
      where: { weekKey },
      data: { data: weekData as unknown as Prisma.InputJsonValue }, // Cast vers JsonValue
    })

    // Supprimer aussi les sélections utilisateur pour ce repas
    await prisma.userSelection.deleteMany({
      where: {
        dayId,
        mealId: mealId,
        weekKey,
      },
    })

    return true
  } catch (error) {
    console.error("Erreur lors de la suppression du repas:", error)
    return false
  }
}

// Fonctions utilitaires
export function getWeekKey(weekOffset: number): string {
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)

  monday.setDate(diff + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const startOfYear = new Date(monday.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

  return `${monday.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`
}

export function getWeekDates(weekOffset = 0) {
  const today = new Date()
  const currentDay = today.getDay()
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)

  const monday = new Date(today)
  monday.setDate(diff + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const weekDays = [
    { name: "Lundi", date: new Date(monday) },
    { name: "Mardi", date: new Date(monday.getTime() + 86400000) },
    { name: "Mercredi", date: new Date(monday.getTime() + 86400000 * 2) },
    { name: "Jeudi", date: new Date(monday.getTime() + 86400000 * 3) },
    { name: "Vendredi", date: new Date(monday.getTime() + 86400000 * 4) },
  ]

  return weekDays.map((day) => ({
    day: day.name,
    date: day.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
  }))
}

export default prisma
