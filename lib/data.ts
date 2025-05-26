import type { User, Meal, DayMeals, UserSelection } from "@/lib/json-utils"

// Fonctions d'API pour les utilisateurs
export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    // Encoder l'email pour éviter les problèmes avec les caractères spéciaux comme @
    const encodedEmail = encodeURIComponent(email)
    const response = await fetch(`/api/users/${encodedEmail}`)
    if (!response.ok) return undefined
    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur par email:", error)
    return undefined
  }
}

// Fonctions d'API pour les repas
export async function createMeal(name: string, description: string): Promise<Meal> {
  const response = await fetch("/api/meals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  })

  if (!response.ok) {
    throw new Error("Erreur lors de la création du repas")
  }

  return await response.json()
}

export async function updateMealDetails(mealId: string, name: string, description: string): Promise<boolean> {
  const response = await fetch(`/api/meals/${mealId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  })

  if (!response.ok) {
    return false
  }

  const data = await response.json()
  return data.success
}

export async function deleteMeal(mealId: string): Promise<boolean> {
  const response = await fetch(`/api/meals/${mealId}`, {
    method: "DELETE",
  })

  if (response.status === 400) {
    // Le repas est utilisé
    return true
  }

  if (!response.ok) {
    throw new Error("Erreur lors de la suppression du repas")
  }

  return false
}

// Fonctions d'API pour les repas hebdomadaires
export async function getWeeklyMealsForWeek(weekOffset = 0): Promise<DayMeals[]> {
  const response = await fetch(`/api/weekly-meals?weekOffset=${weekOffset}`)

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des repas de la semaine")
  }

  return await response.json()
}

export async function updateMeal(
  dayId: string,
  oldMealId: string,
  newMealId: string,
  weekOffset = 0,
): Promise<boolean> {
  const response = await fetch("/api/weekly-meals/update-meal", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dayId, oldMealId, newMealId, weekOffset }),
  })

  if (!response.ok) {
    return false
  }

  const data = await response.json()
  return data.success
}

export async function addMeal(dayId: string, mealId: string, weekOffset = 0): Promise<boolean> {
  const response = await fetch("/api/weekly-meals/add-meal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dayId, mealId, weekOffset }),
  })

  if (!response.ok) {
    return false
  }

  const data = await response.json()
  return data.success
}

export async function removeMeal(dayId: string, mealId: string, weekOffset = 0): Promise<boolean> {
  const response = await fetch("/api/weekly-meals/remove-meal", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dayId, mealId, weekOffset }),
  })

  if (!response.ok) {
    return false
  }

  const data = await response.json()
  return data.success
}

// Mettre à jour les fonctions d'API pour les sélections
export async function selectMeal(
  userId: string,
  userName: string,
  dayId: string,
  mealId: string,
  weekOffset = 0,
): Promise<boolean> {
  const response = await fetch("/api/selections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, userName, dayId, mealId, weekOffset }),
  })

  if (!response.ok) {
    return false
  }

  const data = await response.json()
  return data.success
}

export async function getUserSelections(userId: string, weekOffset = 0): Promise<UserSelection[]> {
  const response = await fetch(`/api/selections?userId=${userId}&weekOffset=${weekOffset}`)

  if (!response.ok) {
    return []
  }

  return await response.json()
}

export async function getMealSelectionsForDay(dayId: string, weekOffset = 0): Promise<UserSelection[]> {
  const response = await fetch(`/api/selections?dayId=${dayId}&weekOffset=${weekOffset}`)

  if (!response.ok) {
    return []
  }

  return await response.json()
}

export async function getAllSelections(weekOffset = 0): Promise<UserSelection[]> {
  const response = await fetch(`/api/selections?weekOffset=${weekOffset}`)

  if (!response.ok) {
    return []
  }

  return await response.json()
}

// Modifier la fonction pour ne vérifier que jeudi et vendredi
export function isThursdayOrFriday(): boolean {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = dimanche, 1 = lundi, ..., 4 = jeudi, 5 = vendredi
  return dayOfWeek === 4 || dayOfWeek === 5 // Jeudi = 4, Vendredi = 5
}

// Garder l'ancienne fonction pour la compatibilité
export function isThursdayOrLater(): boolean {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = dimanche, 1 = lundi, ..., 4 = jeudi
  return dayOfWeek >= 4 // Jeudi = 4, Vendredi = 5, Samedi = 6
}

// Fonction pour déterminer si une date appartient à la semaine prochaine
export function isNextWeek(dateStr: string): boolean {
  // Convertir la chaîne de date (ex: "15 avril") en objet Date
  const today = new Date()

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ")

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

  // Créer une date à partir du jour et du mois
  const date = new Date(today.getFullYear(), monthMap[month], Number.parseInt(day))

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1)
  }

  // Calculer le début de la semaine prochaine (lundi prochain)
  const nextMonday = new Date(today)
  const dayOfWeek = today.getDay() // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek // Si aujourd'hui est dimanche, le prochain lundi est demain
  nextMonday.setDate(today.getDate() + daysUntilNextMonday)
  nextMonday.setHours(0, 0, 0, 0)

  // Calculer la fin de la semaine prochaine (dimanche prochain)
  const nextSunday = new Date(nextMonday)
  nextSunday.setDate(nextMonday.getDate() + 6)
  nextSunday.setHours(23, 59, 59, 999)

  // Vérifier si la date est dans la semaine prochaine
  return date >= nextMonday && date <= nextSunday
}

// Modifier la fonction isDayEditableForAdmin pour prendre en compte le weekOffset
export function isDayEditableForAdmin(dateStr: string, weekOffset = 0): boolean {
  // Si on consulte une semaine passée (weekOffset < 0), aucune modification n'est possible
  if (weekOffset < 0) {
    return false
  }

  // Convertir la chaîne de date (ex: "15 avril") en objet Date
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Réinitialiser l'heure pour comparer uniquement les dates

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ")

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

  // Créer une date à partir du jour et du mois
  const date = new Date(today.getFullYear(), monthMap[month], Number.parseInt(day))

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1)
  }

  // Ajouter un jour à today pour que les modifications soient possibles à partir de demain
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Le jour est modifiable s'il est dans le futur (à partir de demain)
  return date >= tomorrow
}

// Fonction pour déterminer si un jour est modifiable pour un utilisateur simple
export function isDayEditableForUser(dateStr: string): boolean {
  // Convertir la chaîne de date (ex: "15 avril") en objet Date
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Réinitialiser l'heure pour comparer uniquement les dates

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ")

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

  // Créer une date à partir du jour et du mois
  const date = new Date(today.getFullYear(), monthMap[month], Number.parseInt(day))

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1)
  }

  // Ajouter un jour à today pour que les modifications soient possibles à partir de demain
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Règle spéciale : si nous sommes jeudi ou après et que la date est dans la semaine prochaine,
  // alors l'utilisateur peut faire sa sélection
  if (isThursdayOrLater() && isNextWeek(dateStr)) {
    return true
  }

  // Sinon, appliquer la règle standard : le jour est modifiable s'il est dans le futur (à partir de demain)
  return date >= tomorrow
}

// Modifier la fonction getDayAvailabilityMessageForAdmin pour prendre en compte le weekOffset
export function getDayAvailabilityMessageForAdmin(dateStr: string, weekOffset = 0): string {
  // Si on consulte une semaine passée (weekOffset < 0), message spécifique
  if (weekOffset < 0) {
    return "Cette semaine est passée, les modifications sont fermées"
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)  

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ")

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

  // Créer une date à partir du jour et du mois
  const date = new Date(today.getFullYear(), monthMap[month], Number.parseInt(day))

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1)
  }

  // Vérifier si la date est aujourd'hui
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  if (isDayEditableForAdmin(dateStr, weekOffset)) {
    return "Vous pouvez sélectionner ou modifier ce repas"
  } else if (isToday) {
    return "Les sélections pour aujourd'hui sont fermées"
  } else {
    return "Ce jour est passé, les sélections sont fermées"
  }
}

// Fonction pour obtenir un message explicatif sur la disponibilité d'un jour pour un utilisateur simple
export function getDayAvailabilityMessageForUser(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ")

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

  // Créer une date à partir du jour et du mois
  const date = new Date(today.getFullYear(), monthMap[month], Number.parseInt(day))

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1)
  }

  // Vérifier si la date est aujourd'hui
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  if (isDayEditableForUser(dateStr)) {
    if (isNextWeek(dateStr) && isThursdayOrLater()) {
      return "Vous pouvez sélectionner ce repas pour la semaine prochaine"
    }
    return "Vous pouvez sélectionner ou modifier ce repas"
  } else if (isToday) {
    return "Les sélections pour aujourd'hui sont fermées"
  } else if (isNextWeek(dateStr) && !isThursdayOrLater()) {
    return "Les sélections pour la semaine prochaine seront disponibles à partir de jeudi"
  } else {
    return "Ce jour est passé, les sélections sont fermées"
  }
}

// Mettre à jour la fonction de compatibilité pour inclure le weekOffset
export function isDayEditable(dateStr: string, isAdmin = false, weekOffset = 0): boolean {
  return isAdmin ? isDayEditableForAdmin(dateStr, weekOffset) : isDayEditableForUser(dateStr)
}

export function getDayAvailabilityMessage(dateStr: string, isAdmin = false, weekOffset = 0): string {
  return isAdmin ? getDayAvailabilityMessageForAdmin(dateStr, weekOffset) : getDayAvailabilityMessageForUser(dateStr)
}

// Exporter les types pour la compatibilité
export type { User, Meal, DayMeals, UserSelection }

export const meals = [
  { id: "1", name: "Poulet rôti", description: "Poulet rôti avec pommes de terre" },
  { id: "2", name: "Spaghetti Bolognaise", description: "Pâtes avec sauce tomate et viande hachée" },
  { id: "3", name: "Salade César", description: "Salade avec poulet, croûtons et parmesan" },
  { id: "4", name: "Steak-frites", description: "Steak avec frites et salade" },
  { id: "5", name: "Poisson pané", description: "Poisson pané avec riz et légumes" },
  { id: "6", name: "Lasagnes", description: "Lasagnes à la viande et béchamel" },
  { id: "7", name: "Quiche Lorraine", description: "Quiche aux lardons et fromage" },
  { id: "8", name: "Couscous", description: "Couscous avec légumes et viande" },
  { id: "9", name: "Pizza Margherita", description: "Pizza avec tomate et mozzarella" },
  { id: "10", name: "Ratatouille", description: "Légumes mijotés à la provençale" },
]
