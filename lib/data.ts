import type {
  User,
  Meal,
  DayMeals,
  UserSelection,
  PendingUser,
  Holiday,
} from "@/lib/json-utils";
import { callApi } from "./utils";

// Fonctions d'API pour les utilisateurs


export async function getUserLogin(email: string, password: string): Promise<User | undefined> {
  try {
    const encodedEmail = encodeURIComponent(email)
    const data = await callApi<Promise<User>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    return data
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur par email:", error)
    return undefined
  }
}
export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const encodedEmail = encodeURIComponent(email)
    const data = await callApi<Promise<User>>(`/api/users/${encodedEmail}`)
    return data
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur par email:", error)
    return undefined
  }
}

export async function getPendingUsers(): Promise<PendingUser[]> {
  try {
    const data = await callApi<PendingUser[]>(`/api/users/pending`)
    return data
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs en attente:", error)
    return []
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const data = await callApi<User[]>(`/api/users`)
    return data
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les utilisateurs:", error)
    return []
  }
}

export async function addNewUser(name: string, email: string, password: string, role: string): Promise<User> {
  try {
    const response = await callApi<{ user: User }>("/api/users", {
      method: "POST",
      body: JSON.stringify({name, email, password, role}),
    })
    console.log("response : ", response)

    if (!response.user) {
      throw new Error("Aucun utilisateur retourné")
    }
    
    return response.user
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un nouvel utilisateur:", error)
    throw error
  }
}

export async function updateUser(userData: User): Promise<User> {
  try {
    const response = await callApi<User>(`/api/users/${userData.id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
    return response
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error)
    throw error
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await callApi<{ success: boolean }>(`/api/users/${userId}`, {
      method: "DELETE",
    })
    if (!response.success) {
      throw new Error("Échec de la suppression de l'utilisateur")
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    throw error
  }
}


export async function validateUser(pendingUserId: string, action: "approve" | "reject"): Promise<void> {
  try{
    const response = await callApi<{ success: boolean }>("/api/auth/validate-user", {
      method: "POST",
      body: JSON.stringify({ pendingUserId, action }),
    })

    if (!response.success) {
      throw new Error("Échec de la validation de l'utilisateur")
    }
  } catch (error) {
    console.error("Erreur lors de la validation de l'utilisateur:", error)
    throw error
  }
}

// Fonctions d'API pour holidays
export async function getHolidays(): Promise<Holiday[]> {
  try {
    const data = await callApi<Holiday[]>(`/api/holidays`)
    return data
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les jours fériés:", error)
    return []
  }
}

export async function postHoliday(name: string, date: string, recurring: boolean): Promise<Holiday> {
  try{
    const response = await callApi<{ holiday: Holiday }>("/api/holidays", {
      method: "POST",
      body: JSON.stringify({name, date, recurring}),
    })
    
    return response.holiday
  } catch (error) {
    console.error("Erreur lors de l'ajout du jour férié':", error)
    throw error
  }
}


export async function deleteHoliday(holidayId: string): Promise<void> {
  try {
    const data = await callApi<{ success: boolean }>(`/api/holidays/${holidayId}`, {
      method: "DELETE",
    })

    if (!data.success) {
      throw new Error("Échec de la suppression du jour férié")
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du jour férié:", error)
    throw error
  }
}

// Fonctions d'API pour les repas

export async function getAllMeals(): Promise<Meal[]> {
  try {
    const meals = await callApi<Meal[]>("/api/meals")
    return meals
  } catch (error) {
    console.error("Erreur lors de la récupération des repas:", error)
    return []
  }
}

export async function createMeal(name: string, description: string): Promise<Meal> {
  try{ 
    const response = await callApi<Meal>("/api/meals", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    })
    return response
  } catch (error) {
    console.error("Erreur lors de la création du repas:", error)
    throw error
  }
}

export async function updateMealDetails(mealId: string, name: string, description: string): Promise<boolean> {
  try{
    const response = await callApi<{ success: boolean }>(`/api/meals/${mealId}`, {
      method: "PUT",
      body: JSON.stringify({ name, description }),
    })
    return response.success
  } catch (error) {
    console.error("Erreur lors de la mise à jour du repas:", error)
    return false
  }
}

export async function deleteMeal(mealId: string): Promise<boolean> {
  try{
    const response = await callApi<{ success: boolean }>(`/api/meals/${mealId}`, {
      method: "DELETE",
    })
    return response.success
  } catch (error) {
    console.error("Erreur lors de la suppression du repas:", error)
    return false
  }
}

// Fonctions d'API pour les repas hebdomadaires
export async function getWeeklyMealsForWeek(weekOffset = 0): Promise<DayMeals[]> {
  try {
    const data = await callApi<DayMeals[]>(
      `/api/weekly-meals?weekOffset=${weekOffset}`
    )
    return data
  } catch (error) {
    console.error("Erreur lors de la récupération des repas hebdomadaires:", error)
    return []
  }
}
export async function updateMeal(
  dayId: string,
  oldMealId: string,
  newMealId: string,
  weekOffset = 0
): Promise<boolean> {
  try {
    const response = await callApi<{ success: boolean }>("/api/weekly-meals", {
      method: "PUT",
      body: JSON.stringify({ dayId, oldMealId, newMealId, weekOffset }),
    })
    return response.success
  } catch (error) {
    console.error("Erreur lors de la mise à jour du repas:", error)
    return false
  }
}

export async function addMeal(dayId: string, mealId: string, weekOffset = 0): Promise<boolean> {
  try {
    const response = await callApi<{ success: boolean }>("/api/weekly-meals", {
      method: "POST",
      body: JSON.stringify({ dayId, mealId, weekOffset }),
    })
    return response.success
  } catch (error) {
    console.error("Erreur lors de l'ajout du repas:", error)
    return false
  }
}

export async function removeMeal(
  dayId: string,
  mealId: string,
  weekOffset = 0
): Promise<boolean> {
  try {
    const response = await callApi<{ success: boolean }>("/api/weekly-meals", {
      method: "DELETE",
      body: JSON.stringify({ dayId, mealId, weekOffset }),
    })
    return response.success
  } catch (error) {
    console.error("Erreur lors de la suppression du repas:", error)
    return false
  }
}


// Mettre à jour les fonctions d'API pour les sélections
export async function selectMeal(
  userId: string,
  userName: string,
  dayId: string,
  mealId: string,
  weekOffset = 0
): Promise<boolean> {
  try{
    const response = await callApi<{ success: boolean }>("/api/selections", {
      method: "POST",
      body: JSON.stringify({ userId, userName, dayId, mealId, weekOffset }),
    })
    return response.success
  } catch (error) {
    console.error("Erreur lors de la sélection du repas:", error)
    return false
  }
}

export async function deselectMeal(
  userId: string,
  dayId: string,
  weekOffset = 0
): Promise<boolean> {
  try {
    const response = await callApi<{ success: boolean }>("/api/selections", {
      method: "DELETE",
      body: JSON.stringify({ userId, dayId, weekOffset }),
    })

    return response.success
  } catch (error) {
    console.error("Erreur lors de la suppression de la sélection:", error)
    return false
  }
}

export async function getUserSelections(
  userId: string,
  weekOffset = 0
): Promise<UserSelection[]> {
  try {
    const url = `/api/selections?userId=${userId}&weekOffset=${weekOffset}`
    const data = await callApi<UserSelection[]>(url)
    return data
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections utilisateur:", error)
    return []
  }
}

export async function getMealSelectionsForDay(
  dayId: string,
  weekOffset = 0
): Promise<UserSelection[]> {
  try {
    const url = `/api/selections?dayId=${dayId}&weekOffset=${weekOffset}`
    const data = await callApi<{ selections: UserSelection[] }>(url)
    return data.selections || []
  } catch (error) {
    console.error("Erreur lors de la récupération des sélections par jour:", error)
    return []
  }
}

export async function getAllSelections(
  weekOffset = 0
): Promise<UserSelection[]> {
  try {
    const url = `/api/selections?weekOffset=${weekOffset}`
    const data = await callApi<UserSelection[]>(url)
    return data
  } catch (error) {
    console.error("Erreur lors de la récupération de toutes les sélections:", error)
    return []
  }
}


// Fonction pour générer une clé de semaine unique (année-semaine)
export function getWeekKey(weekOffset: number): string {
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  monday.setDate(diff + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  // Calculer le numéro de semaine dans l'année
  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((monday.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7
  );
  return `${monday.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

// Modifier la fonction pour ne vérifier que jeudi et vendredi
export function isThursdayOrFriday(): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 4 = jeudi, 5 = vendredi
  return dayOfWeek === 4 || dayOfWeek === 5; // Jeudi = 4, Vendredi = 5
}

// Garder l'ancienne fonction pour la compatibilité
export function isThursdayOrLater(): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 4 = jeudi
  return dayOfWeek >= 4; // Jeudi = 4, Vendredi = 5, Samedi = 6
}

// Fonction pour déterminer si une date appartient à la semaine prochaine
export function isNextWeek(dateStr: string): boolean {
  // Convertir la chaîne de date (ex: "15 avril") en objet Date
  const today = new Date();

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ");

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
  };

  // Créer une date à partir du jour et du mois
  const date = new Date(
    today.getFullYear(),
    monthMap[month],
    Number.parseInt(day)
  );

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1);
  }

  // Calculer le début de la semaine prochaine (lundi prochain)
  const nextMonday = new Date(today);
  const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Si aujourd'hui est dimanche, le prochain lundi est demain
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);
  nextMonday.setHours(0, 0, 0, 0);

  // Calculer la fin de la semaine prochaine (dimanche prochain)
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999);

  // Vérifier si la date est dans la semaine prochaine
  return date >= nextMonday && date <= nextSunday;
}

// Modifier la fonction isDayEditableForAdmin pour prendre en compte le weekOffset
export function isDayEditableForAdmin(
  dateStr: string,
  weekOffset = 0
): boolean {
  // Si on consulte une semaine passée (weekOffset < 0), aucune modification n'est possible
  if (weekOffset < 0) {
    return false;
  }

  // Convertir la chaîne de date (ex: "15 avril") en objet Date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ");

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
  };

  // Créer une date à partir du jour et du mois
  const date = new Date(
    today.getFullYear(),
    monthMap[month],
    Number.parseInt(day)
  );

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1);
  }

  // Ajouter un jour à today pour que les modifications soient possibles à partir de demain
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Le jour est modifiable s'il est dans le futur (à partir de demain)
  return date >= tomorrow;
}

// Fonction pour déterminer si un jour est modifiable pour un utilisateur simple
export function isDayEditableForUser(dateStr: string): boolean {
  // Convertir la chaîne de date (ex: "15 avril") en objet Date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ");

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
  };

  // Créer une date à partir du jour et du mois
  const date = new Date(
    today.getFullYear(),
    monthMap[month],
    Number.parseInt(day)
  );

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1);
  }

  // Ajouter un jour à today pour que les modifications soient possibles à partir de demain
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Règle spéciale : si nous sommes jeudi ou après et que la date est dans la semaine prochaine,
  // alors l'utilisateur peut faire sa sélection
  if (isThursdayOrLater() && isNextWeek(dateStr)) {
    return true;
  }

  // Sinon, appliquer la règle standard : le jour est modifiable s'il est dans le futur (à partir de demain)
  return date >= tomorrow;
}

// Modifier la fonction getDayAvailabilityMessageForAdmin pour prendre en compte le weekOffset
export function getDayAvailabilityMessageForAdmin(
  dateStr: string,
  weekOffset = 0
): string {
  // Si on consulte une semaine passée (weekOffset < 0), message spécifique
  if (weekOffset < 0) {
    return "Cette semaine est passée, les modifications sont fermées";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ");

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
  };

  // Créer une date à partir du jour et du mois
  const date = new Date(
    today.getFullYear(),
    monthMap[month],
    Number.parseInt(day)
  );

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1);
  }

  // Vérifier si la date est aujourd'hui
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isDayEditableForAdmin(dateStr, weekOffset)) {
    return "Vous pouvez sélectionner ou modifier ce repas";
  } else if (isToday) {
    return "Les sélections pour aujourd'hui sont fermées";
  } else {
    return "Ce jour est passé, les sélections sont fermées";
  }
}

// Fonction pour obtenir un message explicatif sur la disponibilité d'un jour pour un utilisateur simple
export function getDayAvailabilityMessageForUser(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Extraire le jour et le mois de la chaîne
  const [day, month] = dateStr.split(" ");

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
  };

  // Créer une date à partir du jour et du mois
  const date = new Date(
    today.getFullYear(),
    monthMap[month],
    Number.parseInt(day)
  );

  // Si le mois est déjà passé cette année, il s'agit peut-être de l'année prochaine
  if (date < today && date.getMonth() < today.getMonth()) {
    date.setFullYear(today.getFullYear() + 1);
  }

  // Vérifier si la date est aujourd'hui
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isDayEditableForUser(dateStr)) {
    if (isNextWeek(dateStr) && isThursdayOrLater()) {
      return "Vous pouvez sélectionner ce repas pour la semaine prochaine";
    }
    return "Vous pouvez sélectionner ou modifier ce repas";
  } else if (isToday) {
    return "Les sélections pour aujourd'hui sont fermées";
  } else if (isNextWeek(dateStr) && !isThursdayOrLater()) {
    return "Les sélections pour la semaine prochaine seront disponibles à partir de jeudi";
  } else {
    return "Ce jour est passé, les sélections sont fermées";
  }
}

// Mettre à jour la fonction de compatibilité pour inclure le weekOffset
export function isDayEditable(
  dateStr: string,
  isAdmin = false,
  weekOffset = 0
): boolean {
  return isAdmin
    ? isDayEditableForAdmin(dateStr, weekOffset)
    : isDayEditableForUser(dateStr);
}

export function getDayAvailabilityMessage(
  dateStr: string,
  isAdmin = false,
  weekOffset = 0
): string {
  return isAdmin
    ? getDayAvailabilityMessageForAdmin(dateStr, weekOffset)
    : getDayAvailabilityMessageForUser(dateStr);
}

// Exporter les types pour la compatibilité
export type { User, Meal, DayMeals, UserSelection };

