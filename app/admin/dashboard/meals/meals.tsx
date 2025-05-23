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
import { toast } from "sonner"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { Meal } from "@/lib/json-utils"

export default function MealsClientPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newMeal, setNewMeal] = useState({ name: "", description: "" })
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null)

  useEffect(() => {
    const fetchMeals = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/meals")
        if (!response.ok) throw new Error("Erreur lors de la récupération des repas")
        const data = await response.json()
        setMeals(data)
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur", {
          description: "Impossible de charger les repas",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMeals()
  }, [])

  const handleAddMeal = async () => {
    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMeal),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erreur lors de la création du repas")
      }

      const createdMeal = await response.json()
      setMeals([...meals, createdMeal])
      setIsAddDialogOpen(false)
      setNewMeal({ name: "", description: "" })

      toast.success("Repas créé", {
        description: "Le repas a été créé avec succès",
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur lors de la création du repas",
      })
    }
  }

  const handleEditMeal = async () => {
    if (!editingMeal) return

    try {
      const response = await fetch(`/api/meals/${editingMeal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingMeal.name,
          description: editingMeal.description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erreur lors de la modification du repas")
      }

      setMeals(meals.map((meal) => (meal.id === editingMeal.id ? editingMeal : meal)))
      setIsEditDialogOpen(false)
      setEditingMeal(null)

      toast.success("Repas modifié", {
        description: "Le repas a été modifié avec succès",
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur lors de la modification du repas",
      })
    }
  }

  const handleDeleteMeal = async () => {
    if (!mealToDelete) return

    try {
      const response = await fetch(`/api/meals/${mealToDelete.id}`, {
        method: "DELETE",
      })

      if (response.status === 400) {
        // Le repas est utilisé
        toast.error("Suppression impossible", {
          description: "Ce repas est utilisé dans un ou plusieurs plannings et ne peut pas être supprimé",
        })
        setIsDeleteDialogOpen(false)
        setMealToDelete(null)
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erreur lors de la suppression du repas")
      }

      setMeals(meals.filter((meal) => meal.id !== mealToDelete.id))
      setIsDeleteDialogOpen(false)
      setMealToDelete(null)

      toast.success("Repas supprimé", {
        description: "Le repas a été supprimé avec succès",
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur lors de la suppression du repas",
      })
    }
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
        <h1 className="text-3xl font-bold">Gestion des repas</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un repas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des repas</CardTitle>
          <CardDescription>Gérez les repas disponibles pour les utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    Aucun repas trouvé
                  </TableCell>
                </TableRow>
              ) : (
                meals.map((meal) => (
                  <TableRow key={meal.id}>
                    <TableCell className="font-medium">{meal.name}</TableCell>
                    <TableCell>{meal.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingMeal(meal)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setMealToDelete(meal)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Meal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un repas</DialogTitle>
            <DialogDescription>Ajoutez un nouveau repas à la liste des repas disponibles</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meal-name">Nom du repas</Label>
              <Input
                id="meal-name"
                value={newMeal.name}
                onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                placeholder="Ex: Poulet rôti"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-description">Description</Label>
              <Input
                id="meal-description"
                value={newMeal.description}
                onChange={(e) => setNewMeal({ ...newMeal, description: e.target.value })}
                placeholder="Ex: Poulet rôti avec pommes de terre"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddMeal} disabled={!newMeal.name}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Meal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le repas</DialogTitle>
            <DialogDescription>Modifiez les informations du repas</DialogDescription>
          </DialogHeader>
          {editingMeal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-meal-name">Nom du repas</Label>
                <Input
                  id="edit-meal-name"
                  value={editingMeal.name}
                  onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-meal-description">Description</Label>
                <Input
                  id="edit-meal-description"
                  value={editingMeal.description}
                  onChange={(e) => setEditingMeal({ ...editingMeal, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditMeal} disabled={!editingMeal?.name}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Meal Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le repas</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce repas ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {mealToDelete && (
            <div className="py-4">
              <p>
                Vous êtes sur le point de supprimer le repas <strong>{mealToDelete.name}</strong>.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Note: Si ce repas est utilisé dans un planning, il ne pourra pas être supprimé.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteMeal}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
