// "use client"

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { toast } from "sonner"
// import type { DayMeals, UserSelection } from "@/lib/data"

// // Clés de requête
// export const queryKeys = {
//   weeklyMeals: (weekOffset: number) => ["weeklyMeals", weekOffset],
//   userSelections: (userId: string, weekOffset: number) => ["userSelections", userId, weekOffset],
//   pendingUsers: "pendingUsers",
// }

// // Hooks pour les repas hebdomadaires
// export function useWeeklyMeals(weekOffset: number) {
//   return useQuery({
//     queryKey: queryKeys.weeklyMeals(weekOffset),
//     queryFn: async (): Promise<DayMeals[]> => {
//       const response = await fetch(`/api/weekly-meals?weekOffset=${weekOffset}`)
//       if (!response.ok) {
//         throw new Error("Erreur lors de la récupération des repas")
//       }
//       return response.json()
//     },
//   })
// }

// // Hooks pour les sélections d'utilisateurs
// export function useUserSelections(userId: string, weekOffset: number) {
//   return useQuery({
//     queryKey: queryKeys.userSelections(userId, weekOffset),
//     queryFn: async (): Promise<UserSelection[]> => {
//       const response = await fetch(`/api/selections?userId=${userId}&weekOffset=${weekOffset}`)
//       if (!response.ok) {
//         throw new Error("Erreur lors de la récupération des sélections")
//       }
//       return response.json()
//     },
//   })
// }

// // Hook pour sélectionner un repas
// export function useSelectMeal() {
//   const queryClient = useQueryClient()

//   return useMutation({
//     mutationFn: async ({
//       userId,
//       userName,
//       dayId,
//       mealId,
//       weekOffset = 0,
//     }: {
//       userId: string
//       userName: string
//       dayId: string
//       mealId: string
//       weekOffset?: number
//     }) => {
//       const response = await fetch("/api/selections", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ userId, userName, dayId, mealId, weekOffset }),
//       })

//       if (!response.ok) {
//         const error = await response.json()
//         throw new Error(error.error || "Erreur lors de la sélection du repas")
//       }

//       return response.json()
//     },
//     onSuccess: (_, variables) => {
//       // Invalider les requêtes pour forcer un rafraîchissement des données
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.userSelections(variables.userId, variables.weekOffset || 0),
//       })

//       toast.success("Repas sélectionné", {
//         description: "Votre choix a été enregistré",
//       })
//     },
//     onError: (error) => {
//       toast.error("Erreur", {
//         description: error.message || "Impossible de sélectionner le repas",
//       })
//     },
//   })
// }

// // Hook pour récupérer les utilisateurs en attente
// export function usePendingUsers() {
//   return useQuery({
//     queryKey: queryKeys.pendingUsers,
//     queryFn: async () => {
//       const response = await fetch("/api/users/pending")
//       if (!response.ok) {
//         throw new Error("Erreur lors de la récupération des utilisateurs en attente")
//       }
//       return response.json()
//     },
//   })
// }
