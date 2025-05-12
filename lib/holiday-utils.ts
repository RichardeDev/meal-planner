import { addDays } from "date-fns"

// Fonction pour calculer la date de Pâques (algorithme de Meeus/Jones/Butcher)
export function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month, day)
}

// Fonction pour obtenir tous les jours fériés français pour une année donnée
export function getFrenchHolidays(year: number): { name: string; date: Date; recurring: boolean }[] {
  // Jours fériés fixes
  const fixedHolidays = [
    { name: "Jour de l'An", date: new Date(year, 0, 1), recurring: true },
    { name: "Fête du Travail", date: new Date(year, 4, 1), recurring: true },
    { name: "Victoire 1945", date: new Date(year, 4, 8), recurring: true },
    { name: "Fête Nationale", date: new Date(year, 6, 14), recurring: true },
    { name: "Assomption", date: new Date(year, 7, 15), recurring: true },
    { name: "Toussaint", date: new Date(year, 10, 1), recurring: true },
    { name: "Armistice 1918", date: new Date(year, 10, 11), recurring: true },
    { name: "Noël", date: new Date(year, 11, 25), recurring: true },
  ]

  // Calcul des jours fériés mobiles basés sur Pâques
  const easterSunday = getEasterSunday(year)
  const easterMonday = addDays(easterSunday, 1)
  const ascensionThursday = addDays(easterSunday, 39)
  const pentecostMonday = addDays(easterSunday, 50)

  const mobileHolidays = [
    { name: "Lundi de Pâques", date: easterMonday, recurring: false },
    { name: "Ascension", date: ascensionThursday, recurring: false },
    { name: "Lundi de Pentecôte", date: pentecostMonday, recurring: false },
  ]

  return [...fixedHolidays, ...mobileHolidays]
}

// Fonction pour vérifier si une date est un jour férié
export function isHoliday(date: Date, holidays: { name: string; date: Date; recurring: boolean }[]): boolean {
  return holidays.some(
    (holiday) =>
      holiday.date.getDate() === date.getDate() &&
      holiday.date.getMonth() === date.getMonth() &&
      (holiday.recurring || holiday.date.getFullYear() === date.getFullYear()),
  )
}

// Fonction pour obtenir le nom d'un jour férié
export function getHolidayName(date: Date, holidays: { name: string; date: Date; recurring: boolean }[]): string {
  const holiday = holidays.find(
    (h) =>
      h.date.getDate() === date.getDate() &&
      h.date.getMonth() === date.getMonth() &&
      (h.recurring || h.date.getFullYear() === date.getFullYear()),
  )
  return holiday ? holiday.name : ""
}

// Fonction pour convertir les jours fériés en format API
export function convertHolidaysToApiFormat(
  holidays: { name: string; date: Date; recurring: boolean }[],
): { name: string; date: string; recurring: boolean }[] {
  return holidays.map((holiday) => ({
    name: holiday.name,
    date: holiday.date.toISOString().split("T")[0], // Format YYYY-MM-DD
    recurring: holiday.recurring,
  }))
}
