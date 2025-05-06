import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7)


  // const currentDate = new Date(date.getTime())
  // currentDate.setHours(0, 0, 0, 0)
  // // Déterminer le premier lundi de l'année
  // const yearStart = new Date(currentDate.getFullYear(), 0, 1)
  // const daysDiff = Math.floor(
  //   (currentDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
  // )
  // const adjustedDay = (currentDate.getDay() + 6) % 7
  // const weekNumber = Math.ceil((daysDiff - adjustedDay + 1) / 7)
  // return weekNumber
}

