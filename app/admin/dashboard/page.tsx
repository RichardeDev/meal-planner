"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, FileDown, Edit, Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import UserHeader from "@/components/user-header"
import {
  type DayMeals,
  type Meal,
  type UserSelection,
  meals as allMeals,
  updateMeal,
  addMeal,
  removeMeal,
  deleteMeal,
  createMeal,
  getAllSelections,
  updateMealDetails,
  getWeeklyMealsForWeek,
  isDayEditable,
  getDayAvailabilityMessage,
} from "@/lib/data"
import { toast } from "sonner"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminDashboard() {
  const [currentWeek, setCurrentWeek] = useState<number>(0) // 0 = semaine actuelle
  const [meals, setMeals] = useState<DayMeals[]>([])
  const [mealsList, setMealsList] = useState<Meal[]>(allMeals)
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [selectedMeal, setSelectedMeal] = useState<string>("")
  const [newMealName, setNewMealName] = useState<string>("")
  const [newMealDescription, setNewMealDescription] = useState<string>("")
  const [editingMealDetails, setEditingMealDetails] = useState<Meal | null>(null)
  const [userSelections, setUserSelections] = useState<UserSelection[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreateMealDialogOpen, setIsCreateMealDialogOpen] = useState(false)
  const [isEditMealDetailsDialogOpen, setIsEditMealDetailsDialogOpen] = useState(false)
  const [isDeleteMealDialogOpen, setIsDeleteMealDialogOpen] = useState(false)
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null)
  const [editingMeal, setEditingMeal] = useState<{ dayId: string; mealId: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger les repas de la semaine sélectionnée
  useEffect(() => {
    const loadWeeklyMeals = async () => {
      setIsLoading(true)
      try {
        const weekMeals = await getWeeklyMealsForWeek(currentWeek)
        setMeals(weekMeals)

        // Si la semaine change, sélectionner le premier jour par défaut
        if (weekMeals.length > 0) {
          setSelectedDay(weekMeals[0].day)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des repas:", error)
        toast.error("Erreur", {
          description: "Impossible de charger les repas de la semaine",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadWeeklyMeals()
  }, [currentWeek])

  // Charger toutes les sélections au démarrage
  useEffect(() => {
    const loadAllSelections = async () => {
      try {
        const selections = await getAllSelections()
        setUserSelections(selections)
      } catch (error) {
        console.error("Erreur lors du chargement des sélections:", error)
      }
    }

    loadAllSelections()
  }, [])

  const handleViewSelections = async (dayId: string) => {
    setSelectedDay(dayId)
  }

  const handleEditMeal = (dayId: string, mealId: string) => {
    // Trouver la date correspondant au jour
    const dayData = meals.find((d) => d.day === dayId)
    if (!dayData) return

    // Vérifier si le jour est modifiable (dans le futur)
    // Pour les administrateurs, utiliser isAdmin=true et passer le currentWeek
    if (!isDayEditable(dayData.date, true, currentWeek)) {
      toast.error("Modification impossible", {
        description: getDayAvailabilityMessage(dayData.date, true, currentWeek),
      })
      return
    }

    setEditingMeal({ dayId, mealId })
    setSelectedMeal("")
    setIsEditDialogOpen(true)
  }

  const handleAddMeal = (dayId: string) => {
    // Trouver la date correspondant au jour
    const dayData = meals.find((d) => d.day === dayId)
    if (!dayData) return

    // Vérifier si le jour est modifiable (dans le futur)
    // Pour les administrateurs, utiliser isAdmin=true et passer le currentWeek
    if (!isDayEditable(dayData.date, true, currentWeek)) {
      toast.error("Modification impossible", {
        description: getDayAvailabilityMessage(dayData.date, true, currentWeek),
      })
      return
    }

    setSelectedDay(dayId)
    setSelectedMeal("")
    setIsAddDialogOpen(true)
  }

  const handleRemoveMeal = async (dayId: string, mealId: string) => {
    // Trouver la date correspondant au jour
    const dayData = meals.find((d) => d.day === dayId)
    if (!dayData) return

    // Vérifier si le jour est modifiable (dans le futur)
    // Pour les administrateurs, utiliser isAdmin=true et passer le currentWeek
    if (!isDayEditable(dayData.date, true, currentWeek)) {
      toast.error("Suppression impossible", {
        description: getDayAvailabilityMessage(dayData.date, true, currentWeek),
      })
      return
    }

    await removeMeal(dayId, mealId, currentWeek)
    const updatedMeals = await getWeeklyMealsForWeek(currentWeek)
    setMeals(updatedMeals)

    // Recharger les sélections après suppression
    const selections = await getAllSelections()
    setUserSelections(selections)

    toast.success("Repas supprimé", {
      description: "Le repas a été supprimé avec succès du jour",
    })
  }

  const confirmEditMeal = async () => {
    if (!editingMeal || !selectedMeal) return

    await updateMeal(editingMeal.dayId, editingMeal.mealId, selectedMeal, currentWeek)
    const updatedMeals = await getWeeklyMealsForWeek(currentWeek)
    setMeals(updatedMeals)

    // Recharger les sélections après modification
    const selections = await getAllSelections()
    setUserSelections(selections)

    setIsEditDialogOpen(false)

    toast.success("Repas modifié", {
      description: "Le repas a été modifié avec succès",
    })
  }

  const confirmAddMeal = async () => {
    if (!selectedDay || !selectedMeal) {
      toast.error("Sélection manquante", {
        description: "Veuillez sélectionner un repas",
      })
      return
    }

    // Ajouter le repas au jour sélectionné
    await addMeal(selectedDay, selectedMeal, currentWeek)

    // Mettre à jour l'état
    const updatedMeals = await getWeeklyMealsForWeek(currentWeek)
    setMeals(updatedMeals)
    setIsAddDialogOpen(false)

    toast.success("Repas ajouté", {
      description: "Le repas a été ajouté avec succès",
    })
  }

  const handleCreateMeal = () => {
    setNewMealName("")
    setNewMealDescription("")
    setIsCreateMealDialogOpen(true)
  }

  const confirmCreateMeal = async () => {
    if (!newMealName.trim()) {
      toast.error("Informations manquantes", {
        description: "Veuillez saisir au moins un nom pour le repas",
      })
      return
    }

    // Créer un nouveau repas
    const newMeal = await createMeal(newMealName, newMealDescription)

    // Mettre à jour la liste des repas
    setMealsList([...allMeals])
    setIsCreateMealDialogOpen(false)

    toast.success("Repas créé", {
      description: "Le nouveau repas a été créé avec succès",
    })
  }

  const handleEditMealDetails = (meal: Meal) => {
    setEditingMealDetails(meal)
    setNewMealName(meal.name)
    setNewMealDescription(meal.description)
    setIsEditMealDetailsDialogOpen(true)
  }

  const confirmEditMealDetails = async () => {
    if (!editingMealDetails || !newMealName.trim()) {
      toast.error("Informations manquantes", {
        description: "Veuillez saisir au moins un nom pour le repas",
      })
      return
    }

    // Mettre à jour les détails du repas
    await updateMealDetails(editingMealDetails.id, newMealName, newMealDescription)

    // Mettre à jour la liste des repas et les repas de la semaine
    setMealsList([...allMeals])
    const updatedMeals = await getWeeklyMealsForWeek(currentWeek)
    setMeals(updatedMeals)

    // Fermer le dialogue
    setIsEditMealDetailsDialogOpen(false)

    toast.success("Repas modifié", {
      description: "Les détails du repas ont été modifiés avec succès",
    })
  }

  const handleDeleteMeal = (meal: Meal) => {
    setMealToDelete(meal)
    setIsDeleteMealDialogOpen(true)
  }

  const confirmDeleteMeal = async () => {
    if (!mealToDelete) return

    // Vérifier si le repas est utilisé dans une semaine
    const isUsed = await deleteMeal(mealToDelete.id)

    if (!isUsed) {
      // Mettre à jour la liste des repas
      setMealsList([...allMeals])

      // Mettre à jour les repas de la semaine
      const updatedMeals = await getWeeklyMealsForWeek(currentWeek)
      setMeals(updatedMeals)

      // Recharger les sélections
      const selections = await getAllSelections()
      setUserSelections(selections)

      toast.success("Repas supprimé", {
        description: "Le repas a été supprimé avec succès du catalogue",
      })
    } else {
      toast.error("Impossible de supprimer", {
        description: "Ce repas est utilisé dans un ou plusieurs jours de la semaine",
      })
    }

    setIsDeleteMealDialogOpen(false)
  }

  const getMealById = (id: string): Meal | undefined => {
    return allMeals.find((meal) => meal.id === id)
  }

  // Fonction pour obtenir les repas non sélectionnés pour un jour donné
  const getUnselectedMeals = (dayId: string): Meal[] => {
    const day = meals.find((d) => d.day === dayId)
    if (!day) return []

    const selectedMealIds = day.meals.map((m) => m.id)
    return allMeals.filter((meal) => !selectedMealIds.includes(meal.id))
  }

  // Fonction pour naviguer entre les semaines
  const navigateWeek = (direction: number) => {
    // Limiter la navigation entre -3 (3 semaines dans le passé) et 3 (3 semaines dans le futur)
    const newWeek = Math.max(-3, Math.min(3, currentWeek + direction))
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

  // Fonction pour exporter les sélections d'un jour en PDF
  const exportDayToPDF = (dayId: string) => {
    const daySelections = userSelections.filter((s) => s.dayId === dayId)

    if (daySelections.length === 0) {
      toast.error("Aucune sélection", {
        description: "Il n'y a aucune sélection à exporter pour ce jour",
      })
      return
    }

    const doc = new jsPDF()

    // Ajouter un titre
    doc.setFontSize(18)
    doc.text(`Sélections pour ${dayId}`, 14, 22)

    // Organiser les données par repas
    const mealGroups: Record<string, string[]> = {}

    daySelections.forEach((selection) => {
      const meal = getMealById(selection.mealId)
      if (!meal) return

      if (!mealGroups[meal.name]) {
        mealGroups[meal.name] = []
      }

      mealGroups[meal.name].push(selection.userName)
    })

    // Préparer les données pour le tableau
    const tableData: string[][] = []

    Object.entries(mealGroups).forEach(([mealName, users]) => {
      tableData.push([mealName, users.join(", ")])
    })

    // @ts-ignore
    doc.autoTable({
      head: [["Repas", "Utilisateurs"]],
      body: tableData,
      startY: 30,
    })

    // Sauvegarder le PDF
    doc.save(`selections-${dayId.toLowerCase()}.pdf`)

    toast.success("Export réussi", {
      description: "Le PDF a été généré avec succès",
    })
  }

  // Fonction pour exporter toutes les sélections en PDF
  const exportAllToPDF = () => {
    if (userSelections.length === 0) {
      toast.error("Aucune sélection", {
        description: "Il n'y a aucune sélection à exporter",
      })
      return
    }

    const doc = new jsPDF()

    // Ajouter un titre
    doc.setFontSize(18)
    doc.text("Sélections de la semaine", 14, 22)

    let yPosition = 30

    // Pour chaque jour
    meals.forEach((day) => {
      const daySelections = userSelections.filter((s) => s.dayId === day.day)

      if (daySelections.length === 0) return

      // Ajouter le titre du jour
      doc.setFontSize(14)
      doc.text(`${day.day} (${day.date})`, 14, yPosition)
      yPosition += 10

      // Organiser les données par repas
      const mealGroups: Record<string, string[]> = {}

      daySelections.forEach((selection) => {
        const meal = getMealById(selection.mealId)
        if (!meal) return

        if (!mealGroups[meal.name]) {
          mealGroups[meal.name] = []
        }

        mealGroups[meal.name].push(selection.userName)
      })

      // Préparer les données pour le tableau
      const tableData: string[][] = []

      Object.entries(mealGroups).forEach(([mealName, users]) => {
        tableData.push([mealName, users.join(", ")])
      })

      // @ts-ignore
      doc.autoTable({
        head: [["Repas", "Utilisateurs"]],
        body: tableData,
        startY: yPosition,
      })

      // Mettre à jour la position Y pour le prochain jour
      // @ts-ignore
      yPosition = doc.lastAutoTable.finalY + 15
    })

    // Sauvegarder le PDF
    doc.save("selections-semaine.pdf")

    toast.success("Export réussi", {
      description: "Le PDF a été généré avec succès",
    })
  }

  // Afficher un état de chargement pendant que les données sont récupérées
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <UserHeader />
        <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Administration des repas</h1>
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <UserHeader />
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Administration des repas</h1>
          <p className="text-muted-foreground">
            Gérez les repas de la semaine et consultez les sélections des utilisateurs
          </p>
        </div>

        {/* Navigation entre les semaines */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigateWeek(-1)} disabled={currentWeek <= -3}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Semaine précédente
          </Button>

          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {currentWeek === 0
                ? "Semaine actuelle"
                : currentWeek < 0
                  ? `${Math.abs(currentWeek)} semaine${Math.abs(currentWeek) > 1 ? "s" : ""} avant`
                  : `${currentWeek} semaine${currentWeek > 1 ? "s" : ""} après`}
            </h2>
            <p className="text-sm text-muted-foreground">{getWeekTitle(currentWeek)}</p>
          </div>

          <Button variant="outline" onClick={() => navigateWeek(1)} disabled={currentWeek >= 3}>
            Semaine suivante
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 w-full mb-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Repas de la semaine</CardTitle>
              <CardDescription>Modifiez, ajoutez ou supprimez des repas pour chaque jour</CardDescription>
            </CardHeader>
            <CardContent>
              {meals.length > 0 ? (
                <Tabs defaultValue={meals[0]?.day} className="w-full" onValueChange={handleViewSelections}>
                  <TabsList className="w-full grid grid-cols-5">
                    {meals.map((day) => (
                      <TabsTrigger key={day.day} value={day.day}>
                        {day.day}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {meals.map((day) => {
                    // Pour les administrateurs, utiliser isAdmin=true et passer le currentWeek
                    const isEditable = isDayEditable(day.date, true, currentWeek)

                    return (
                      <TabsContent key={day.day} value={day.day} className="space-y-4">
                        {!isEditable && (
                          <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Modification fermée</AlertTitle>
                            <AlertDescription>
                              {getDayAvailabilityMessage(day.date, true, currentWeek)}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">
                            {day.day} <span className="text-sm font-normal text-muted-foreground">({day.date})</span>
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMeal(day.day)}
                            disabled={!isEditable}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {day.meals.map((meal) => (
                            <div key={meal.id} className="flex justify-between items-center p-3 border rounded-md">
                              <div>
                                <div className="font-medium">{meal.name}</div>
                                <div className="text-sm text-muted-foreground">{meal.description}</div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditMeal(day.day, meal.id)}
                                  disabled={!isEditable}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveMeal(day.day, meal.id)}
                                  disabled={!isEditable}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          {day.meals.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">Aucun repas pour ce jour</div>
                          )}
                        </div>
                      </TabsContent>
                    )
                  })}
                </Tabs>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun repas n'a été configuré pour cette semaine
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Sélections des utilisateurs</CardTitle>
                <CardDescription>Consultez les sélections des utilisateurs pour toute la semaine</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportAllToPDF} disabled={userSelections.length === 0}>
                <FileDown className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {meals.map((day) => {
                  // Filtrer les sélections pour ce jour
                  const daySelections = userSelections.filter((s) => s.dayId === day.day)

                  if (daySelections.length === 0) return null

                  return (
                    <div key={day.day} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">
                          {day.day} <span className="text-sm font-normal text-muted-foreground">({day.date})</span>
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportDayToPDF(day.day)}
                          disabled={daySelections.length === 0}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Exporter
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {day.meals.map((meal) => {
                          // Filtrer les sélections pour ce repas
                          const mealSelections = daySelections.filter((s) => s.mealId === meal.id)

                          if (mealSelections.length === 0) return null

                          return (
                            <div key={meal.id} className="border rounded-md p-4">
                              <h4 className="font-medium mb-2">{meal.name}</h4>

                              <div className="space-y-1">
                                {mealSelections.map((selection) => (
                                  <div key={selection.userId} className="text-sm pl-2 border-l-2 border-slate-200">
                                    {selection.userName}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}

                        {!day.meals.some((meal) => daySelections.some((s) => s.mealId === meal.id)) && (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            Aucune sélection pour ce jour
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {userSelections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune sélection n'a été faite pour cette semaine
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carte pour la gestion des repas */}
        <Card className="w-full mb-6">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Gestion des repas</CardTitle>
              <CardDescription>Créez, modifiez ou supprimez des repas dans le catalogue</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCreateMeal}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau repas
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mealsList.map((meal) => (
                    <TableRow key={meal.id}>
                      <TableCell className="font-medium">{meal.name}</TableCell>
                      <TableCell>{meal.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditMealDetails(meal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMeal(meal)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Meal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le repas</DialogTitle>
            <DialogDescription>Sélectionnez un nouveau repas pour remplacer l&apos;actuel</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meal-select">Sélectionnez un repas</Label>
              <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                <SelectTrigger id="meal-select" className="w-full">
                  <SelectValue placeholder="Sélectionnez un repas" />
                </SelectTrigger>
                <SelectContent>
                  {allMeals.map((meal) => (
                    <SelectItem key={meal.id} value={meal.id}>
                      {meal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmEditMeal} disabled={!selectedMeal}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Meal Dialog - Modifié pour n'afficher que les repas non sélectionnés */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un repas</DialogTitle>
            <DialogDescription>Sélectionnez un repas à ajouter pour {selectedDay}</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-meal-select">Sélectionnez un repas</Label>
              <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                <SelectTrigger id="add-meal-select" className="w-full">
                  <SelectValue placeholder="Sélectionnez un repas" />
                </SelectTrigger>
                <SelectContent>
                  {getUnselectedMeals(selectedDay).map((meal) => (
                    <SelectItem key={meal.id} value={meal.id}>
                      {meal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {getUnselectedMeals(selectedDay).length === 0 && (
              <div className="flex items-center gap-2 text-center py-2 text-sm text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Tous les repas disponibles sont déjà ajoutés à ce jour.
                  <br />
                  Créez de nouveaux repas dans la section "Gestion des repas".
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmAddMeal} disabled={!selectedMeal || getUnselectedMeals(selectedDay).length === 0}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Meal Dialog */}
      <Dialog open={isCreateMealDialogOpen} onOpenChange={setIsCreateMealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau repas</DialogTitle>
            <DialogDescription>Ajoutez un nouveau repas au catalogue</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-meal-name">Nom du repas</Label>
              <Input
                id="new-meal-name"
                placeholder="Ex: Lasagnes végétariennes"
                value={newMealName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMealName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-meal-description">Description (optionnelle)</Label>
              <Input
                id="new-meal-description"
                placeholder="Ex: Lasagnes aux légumes et béchamel"
                value={newMealDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMealDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateMealDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmCreateMeal} disabled={!newMealName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Meal Details Dialog */}
      <Dialog open={isEditMealDetailsDialogOpen} onOpenChange={setIsEditMealDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les détails du repas</DialogTitle>
            <DialogDescription>Modifiez les informations du repas</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-meal-name">Nom du repas</Label>
              <Input
                id="edit-meal-name"
                placeholder="Ex: Lasagnes végétariennes"
                value={newMealName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMealName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-meal-description">Description (optionnelle)</Label>
              <Input
                id="edit-meal-description"
                placeholder="Ex: Lasagnes aux légumes et béchamel"
                value={newMealDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMealDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMealDetailsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmEditMealDetails} disabled={!newMealName.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Meal Dialog */}
      <Dialog open={isDeleteMealDialogOpen} onOpenChange={setIsDeleteMealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le repas</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir supprimer ce repas du catalogue ?</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {mealToDelete && (
              <div className="space-y-2">
                <p className="font-medium">{mealToDelete.name}</p>
                <p className="text-sm text-muted-foreground">{mealToDelete.description}</p>
              </div>
            )}

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-300 text-sm flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Attention</p>
                <p>Si ce repas est utilisé dans une semaine, il ne pourra pas être supprimé.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteMealDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMeal}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
