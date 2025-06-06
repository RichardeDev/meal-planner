"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import UserHeader from "@/components/user-header"
import {
  getWeeklyMealsForWeek,
  selectMeal,
  getUserSelections,
  isDayEditable,
  getDayAvailabilityMessage,
  isThursdayOrLater,
} from "@/lib/data"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Composant de chargement pour améliorer l'UX pendant le chargement
function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col">
      <UserHeader />
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Menu de la Semaine</h1>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </main>
    </div>
  )
}

// Composant principal du dashboard utilisateur
export default function UserDashboardClientPage() {
  // Utiliser React Query pour la gestion de l'état et la mise en cache
  const queryClient = useQueryClient()
  const [currentWeek, setCurrentWeek] = useState<number>(0)

  // Récupérer l'utilisateur depuis localStorage (côté client uniquement)
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error)
    }
  }, [])

  // Utiliser l'ID et le nom de l'utilisateur connecté ou des valeurs par défaut
  const userId = user?.id || "2"
  const userName = user?.name || "Regular User"

  // Requête pour récupérer les repas de la semaine
  const {
    data: meals = [],
    isLoading: isMealsLoading,
    error: mealsError,
  } = useQuery({
    queryKey: ["weeklyMeals", currentWeek],
    queryFn: () => getWeeklyMealsForWeek(currentWeek),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Requête pour récupérer les sélections de l'utilisateur
  const {
    data: userSelections = [],
    isLoading: isSelectionsLoading,
    error: selectionsError,
  } = useQuery({
    queryKey: ["userSelections", userId, currentWeek],
    queryFn: () => getUserSelections(userId, currentWeek),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Mutation pour sélectionner un repas
  const selectMealMutation = useMutation({
    mutationFn: ({ dayId, mealId }: { dayId: string; mealId: string }) =>
      selectMeal(userId, userName, dayId, mealId, currentWeek),
    onSuccess: () => {
      // Invalider la requête des sélections pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ["userSelections", userId, currentWeek] })
      toast.success("Repas sélectionné", {
        description: "Votre choix a été enregistré",
      })
    },
    onError: () => {
      toast.error("Erreur", {
        description: "Impossible de sélectionner ce repas",
      })
    },
  })

  // Gérer la sélection d'un repas
  const handleSelectMeal = async (dayId: string, mealId: string) => {
    // Trouver la date correspondant au jour
    const dayData = meals.find((d) => d.day === dayId)
    if (!dayData) return

    // Vérifier si le jour est modifiable (dans le futur)
    if (!isDayEditable(dayData.date)) {
      toast.error("Sélection impossible", {
        description: getDayAvailabilityMessage(dayData.date),
      })
      return
    }

    // Vérifier si c'est un jour férié
    if (dayData.isHoliday) {
      toast.error("Sélection impossible", {
        description: `Ce jour est férié (${dayData.holidayName})`,
      })
      return
    }

    // Exécuter la mutation
    selectMealMutation.mutate({ dayId, mealId })
  }

  const getUserSelectionForDay = (dayId: string) => {
    return userSelections.find((selection) => selection.dayId === dayId)
  }

  const getMealById = (mealId: string) => {
    for (const day of meals) {
      const meal = day.meals.find((m) => m.id === mealId)
      if (meal) return meal
    }
    return null
  }

  // Fonction pour naviguer entre les semaines
  const navigateWeek = (direction: number) => {
    // Limiter la navigation entre 0 (semaine actuelle) et 1 (semaine prochaine)
    const newWeek = Math.max(0, Math.min(1, currentWeek + direction))
    setCurrentWeek(newWeek)
  }

  // Fonction pour obtenir le titre de la semaine
  const getWeekTitle = (weekOffset: number): string => {
    const today = new Date()
    const monday = new Date(today)
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Ajuster quand le jour est dimanche

    monday.setDate(diff + weekOffset * 7)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    }

    return `${formatDate(monday)} - ${formatDate(sunday)}`
  }

  // Afficher un état de chargement pendant que les données sont récupérées
  if (isMealsLoading || isSelectionsLoading) {
    return <LoadingState />
  }

  // Gérer les erreurs
  if (mealsError || selectionsError) {
    return (
      <div className="flex min-h-screen flex-col">
        <UserHeader />
        <main className="flex-1 container py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Une erreur est survenue lors du chargement des données. Veuillez réessayer plus tard.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <UserHeader />
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-2">Menu de la Semaine</h1>
          <p className="text-muted-foreground">Sélectionnez vos repas pour chaque jour de la semaine</p>
        </div>

        {/* Navigation entre les semaines */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigateWeek(-1)} disabled={currentWeek <= 0}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Semaine actuelle
          </Button>

          <div className="text-center">
            <h2 className="text-xl font-semibold">{currentWeek === 0 ? "Semaine actuelle" : "Semaine prochaine"}</h2>
            <p className="text-sm text-muted-foreground">{getWeekTitle(currentWeek)}</p>
          </div>

          <Button
            variant="outline"
            onClick={() => navigateWeek(1)}
            disabled={currentWeek >= 1 || (!isThursdayOrLater() && currentWeek === 0)}
          >
            Semaine suivante
            <AlertCircle className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {meals.length > 0 ? (
          <Tabs defaultValue={meals[0]?.day} className="w-full">
            <TabsList className="w-full grid grid-cols-5">
              {meals.map((day) => (
                <TabsTrigger key={day.day} value={day.day}>
                  {day.day}
                  <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">{day.date}</span>
                  {day.isHoliday && <span className="ml-1 text-red-500">*</span>}
                </TabsTrigger>
              ))}
            </TabsList>

            {meals.map((day) => {
              // Pour les utilisateurs simples, utiliser isAdmin=false (par défaut)
              const isEditable = isDayEditable(day.date) 

              return (
                <TabsContent key={day.day} value={day.day} className="space-y-4">
                  {!isEditable && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Sélection fermée</AlertTitle>
                      <AlertDescription>{getDayAvailabilityMessage(day.date)}</AlertDescription>
                    </Alert>
                  )}
                  {day.isHoliday && (
                    <Alert variant={day.isHoliday ? "default" : "destructive"} className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{day.isHoliday ? "Jour férié" : "Modification fermée"}</AlertTitle>
                      <AlertDescription>
                        {day.isHoliday
                          ? `Ce jour est férié (${day.holidayName})`
                          : getDayAvailabilityMessage(day.date, true, currentWeek)}
                      </AlertDescription>
                    </Alert>
                  )}

                  {!day.isHoliday && (
                    <div className="grid gap-4 md:grid-cols-3">
                      {day.meals.map((meal) => {
                        const isSelected = userSelections.some((s) => s.dayId === day.day && s.mealId === meal.id)

                        return (
                          <Card key={meal.id} className={isSelected ? "border-primary" : ""}>
                            <CardHeader>
                              <CardTitle className="flex justify-between items-start">
                                {meal.name}
                                {isSelected && <Badge className="ml-2">Sélectionné</Badge>}
                              </CardTitle>
                              <CardDescription>{meal.description}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                              <Button
                                onClick={() => handleSelectMeal(day.day, meal.id)}
                                variant={isSelected ? "secondary" : "default"}
                                className="w-full"
                                disabled={!isEditable || selectMealMutation.isPending}
                              >
                                {selectMealMutation.isPending
                                  ? "Chargement..."
                                  : isSelected
                                    ? "Sélectionné"
                                    : "Sélectionner"}
                              </Button>
                            </CardFooter>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Aucun repas n'a été configuré pour cette semaine</div>
        )}

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Vos sélections</CardTitle>
                <CardDescription>Récapitulatif de vos choix pour la semaine</CardDescription>
              </CardHeader>
              <CardContent>
                {userSelections.length > 0 ? (
                  <div className="space-y-2">
                    {meals.map((day) => {
                      const selection = getUserSelectionForDay(day.day)
                      if (!selection) return null

                      const meal = getMealById(selection.mealId)
                      if (!meal) return null

                      const isEditable = isDayEditable(day.date)

                      return (
                        <div key={day.day} className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <span className="font-medium">{day.day}</span>
                            <span className="text-sm text-muted-foreground ml-2">{day.date}</span>
                            {!isEditable && <span className="ml-2 text-xs text-destructive">(Verrouillé)</span>}
                          </div>
                          <div className="font-medium">{meal.name}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Vous n&apos;avez pas encore fait de sélection
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
      </main>
    </div>
  )
}
