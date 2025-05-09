"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { CalendarIcon, Trash2, Plus, Calendar } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Holiday } from "@/lib/json-utils"

// Jours fériés français par défaut
const defaultFrenchHolidays = [
  { name: "Jour de l'An", date: "2024-01-01", recurring: true },
  { name: "Lundi de Pâques", date: "2024-04-01", recurring: false },
  { name: "Fête du Travail", date: "2024-05-01", recurring: true },
  { name: "Victoire 1945", date: "2024-05-08", recurring: true },
  { name: "Ascension", date: "2024-05-09", recurring: false },
  { name: "Lundi de Pentecôte", date: "2024-05-20", recurring: false },
  { name: "Fête Nationale", date: "2024-07-14", recurring: true },
  { name: "Assomption", date: "2024-08-15", recurring: true },
  { name: "Toussaint", date: "2024-11-01", recurring: true },
  { name: "Armistice 1918", date: "2024-11-11", recurring: true },
  { name: "Noël", date: "2024-12-25", recurring: true },
]

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null)
  const [newHoliday, setNewHoliday] = useState<{
    name: string
    date: Date | undefined
    recurring: boolean
  }>({
    name: "",
    date: undefined,
    recurring: false,
  })
  const [view, setView] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [holidayDates, setHolidayDates] = useState<Date[]>([])

  useEffect(() => {
    const fetchHolidays = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/holidays")
        if (!response.ok) throw new Error("Erreur lors de la récupération des jours fériés")
        let data = await response.json()

        // Si aucun jour férié n'est configuré, ajouter les jours fériés français par défaut
        if (data.length === 0) {
          // Ajouter les jours fériés français par défaut
          for (const holiday of defaultFrenchHolidays) {
            await fetch("/api/holidays", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(holiday),
            })
          }

          // Récupérer à nouveau les jours fériés
          const newResponse = await fetch("/api/holidays")
          if (newResponse.ok) {
            data = await newResponse.json()
          }
        }

        setHolidays(data)

        // Préparer les dates pour le calendrier
        const dates = data.map((holiday: Holiday) => new Date(holiday.date))
        setHolidayDates(dates)
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur", {
          description: "Impossible de charger les jours fériés",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHolidays()
  }, [])

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast.error("Informations manquantes", {
        description: "Veuillez remplir tous les champs obligatoires",
      })
      return
    }

    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newHoliday.name,
          date: format(newHoliday.date, "yyyy-MM-dd"),
          recurring: newHoliday.recurring,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erreur lors de l'ajout du jour férié")
      }

      const createdHoliday = await response.json()
      const updatedHolidays = [...holidays, createdHoliday]
      setHolidays(updatedHolidays)
      setHolidayDates([...holidayDates, new Date(createdHoliday.date)])
      setIsAddDialogOpen(false)
      setNewHoliday({
        name: "",
        date: undefined,
        recurring: false,
      })

      toast.success("Jour férié ajouté", {
        description: "Le jour férié a été ajouté avec succès",
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur lors de l'ajout du jour férié",
      })
    }
  }

  const handleDeleteHoliday = async () => {
    if (!holidayToDelete) return

    try {
      const response = await fetch(`/api/holidays/${holidayToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erreur lors de la suppression du jour férié")
      }

      const updatedHolidays = holidays.filter((holiday) => holiday.id !== holidayToDelete.id)
      setHolidays(updatedHolidays)
      setHolidayDates(updatedHolidays.map((holiday) => new Date(holiday.date)))
      setIsDeleteDialogOpen(false)
      setHolidayToDelete(null)

      toast.success("Jour férié supprimé", {
        description: "Le jour férié a été supprimé avec succès",
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur lors de la suppression du jour férié",
      })
    }
  }

  // Fonction pour vérifier si une date est un jour férié
  const isHoliday = (date: Date) => {
    return holidayDates.some(
      (holidayDate) => holidayDate.getDate() === date.getDate() && holidayDate.getMonth() === date.getMonth(),
    )
  }

  // Fonction pour obtenir le nom du jour férié
  const getHolidayName = (date: Date) => {
    const holiday = holidays.find((h) => {
      const holidayDate = new Date(h.date)
      return holidayDate.getDate() === date.getDate() && holidayDate.getMonth() === date.getMonth()
    })
    return holiday ? holiday.name : ""
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des jours fériés</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setView(view === "list" ? "calendar" : "list")}>
            {view === "list" ? <Calendar className="h-4 w-4 mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
            {view === "list" ? "Vue Calendrier" : "Vue Liste"}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un jour férié
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Jours fériés</CardTitle>
            <CardDescription>Gérez les jours fériés pour lesquels aucun repas ne sera proposé</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Aucun jour férié configuré
                    </TableCell>
                  </TableRow>
                ) : (
                  holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>
                        {new Date(holiday.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {holiday.recurring ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                            Récurrent (chaque année)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                            Unique
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setHolidayToDelete(holiday)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Calendrier des jours fériés</CardTitle>
            <CardDescription>Visualisez tous les jours fériés de l'année</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                locale={fr}
                modifiers={{
                  holiday: (date) => isHoliday(date),
                }}
                modifiersClassNames={{
                  holiday: "bg-red-100 text-red-600 font-bold",
                }}
                components={{
                  DayContent: ({ date }) => (
                    <div>
                      {date.getDate()}
                      {isHoliday(date) && (
                        <div className="absolute bottom-0 left-0 right-0 text-[8px] text-center overflow-hidden text-ellipsis whitespace-nowrap px-1">
                          {getHolidayName(date)}
                        </div>
                      )}
                    </div>
                  ),
                }}
              />
            </div>
            {selectedDate && isHoliday(selectedDate) && (
              <div className="mt-4 p-4 bg-red-50 rounded-md">
                <h3 className="font-medium text-red-600">{getHolidayName(selectedDate)}</h3>
                <p className="text-sm text-red-500">
                  {selectedDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Holiday Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un jour férié</DialogTitle>
            <DialogDescription>Ajoutez un jour férié pour lequel aucun repas ne sera proposé</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="holiday-name">Nom du jour férié</Label>
              <Input
                id="holiday-name"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="Ex: Noël"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newHoliday.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newHoliday.date ? (
                      format(newHoliday.date, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newHoliday.date}
                    onSelect={(date) => setNewHoliday({ ...newHoliday, date })}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="holiday-recurring"
                checked={newHoliday.recurring}
                onCheckedChange={(checked) => setNewHoliday({ ...newHoliday, recurring: checked as boolean })}
              />
              <Label htmlFor="holiday-recurring">Récurrent (se répète chaque année à la même date)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddHoliday}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le jour férié</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce jour férié ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {holidayToDelete && (
            <div className="py-4">
              <p>
                Vous êtes sur le point de supprimer le jour férié <strong>{holidayToDelete.name}</strong> (
                {new Date(holidayToDelete.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                ).
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteHoliday}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
