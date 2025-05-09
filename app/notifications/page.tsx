"use client"

import { useState, useEffect } from "react"
import { useNotificationStore } from "@/lib/notification-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2, ArrowLeft, Send } from "lucide-react"
import UserHeader from "@/components/user-header"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { NotificationType } from "@/lib/notification-store"

export default function NotificationsPage() {
  const { notifications, markAsRead, removeNotification, markAllAsRead, clearNotifications, addNotification } =
    useNotificationStore()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as NotificationType,
    persistent: false,
    expiresInMs: 0, // 0 = pas d'expiration
  })

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

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  const handleRemoveNotification = (id: string) => {
    removeNotification(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleClearRead = () => {
    // Supprimer toutes les notifications lues qui ne sont pas persistantes
    readNotifications
      .filter((n) => !n.persistent)
      .forEach((n) => {
        removeNotification(n.id)
      })
  }

  const handleSendNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error("Informations manquantes", {
        description: "Le titre et le message sont requis",
      })
      return
    }

    const options: { persistent?: boolean; expiresInMs?: number } = {}

    if (newNotification.persistent) {
      options.persistent = true
    }

    if (newNotification.expiresInMs > 0) {
      options.expiresInMs = newNotification.expiresInMs
    }

    addNotification({
      type: newNotification.type,
      title: newNotification.title,
      message: newNotification.message,
      ...options,
    })

    toast.success("Notification envoyée", {
      description: "La notification a été envoyée avec succès",
    })

    // Réinitialiser le formulaire
    setNewNotification({
      title: "",
      message: "",
      type: "info",
      persistent: false,
      expiresInMs: 0,
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <UserHeader />
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" asChild>
            <Link href="/user/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Centre de notifications</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {user?.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Envoyer une notification</CardTitle>
                <CardDescription>Créez et envoyez une notification à tous les utilisateurs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-title">Titre</Label>
                    <Input
                      id="notification-title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                      placeholder="Ex: Maintenance prévue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-message">Message</Label>
                    <Textarea
                      id="notification-message"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                      placeholder="Ex: Une maintenance est prévue le 15 juin de 18h à 20h."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-type">Type</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value) =>
                        setNewNotification({ ...newNotification, type: value as NotificationType })
                      }
                    >
                      <SelectTrigger id="notification-type">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="warning">Avertissement</SelectItem>
                        <SelectItem value="success">Succès</SelectItem>
                        <SelectItem value="error">Erreur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-expiration">Expiration</Label>
                    <Select
                      value={newNotification.expiresInMs.toString()}
                      onValueChange={(value) =>
                        setNewNotification({ ...newNotification, expiresInMs: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger id="notification-expiration">
                        <SelectValue placeholder="Sélectionner une durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Pas d'expiration</SelectItem>
                        <SelectItem value="3600000">1 heure</SelectItem>
                        <SelectItem value="86400000">1 jour</SelectItem>
                        <SelectItem value="604800000">1 semaine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="notification-persistent"
                      checked={newNotification.persistent}
                      onChange={(e) => setNewNotification({ ...newNotification, persistent: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="notification-persistent" className="text-sm font-normal">
                      Notification persistante (ne peut pas être supprimée par l'utilisateur)
                    </Label>
                  </div>
                  <Button className="w-full" onClick={handleSendNotification}>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer la notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={user?.role === "admin" ? "" : "md:col-span-2"}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Vos notifications</CardTitle>
                  <CardDescription>Gérez toutes vos notifications</CardDescription>
                </div>
                <div className="flex gap-2">
                  {unreadNotifications.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                      <Check className="h-4 w-4 mr-2" />
                      Tout marquer comme lu
                    </Button>
                  )}
                  {readNotifications.some((n) => !n.persistent) && (
                    <Button variant="outline" size="sm" onClick={handleClearRead}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer les lues
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Toutes ({notifications.length})</TabsTrigger>
                  <TabsTrigger value="unread">Non lues ({unreadNotifications.length})</TabsTrigger>
                  <TabsTrigger value="read">Lues ({readNotifications.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune notification</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn("p-4 border rounded-lg", !notification.read && "bg-muted/50")}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mr-2",
                                notification.type === "warning" || notification.type === "error"
                                  ? "bg-destructive"
                                  : notification.type === "success"
                                    ? "bg-green-500"
                                    : "bg-blue-500",
                              )}
                            />
                            <span className="font-medium">{notification.title}</span>
                            {!notification.read && (
                              <Badge variant="outline" className="ml-2">
                                Nouveau
                              </Badge>
                            )}
                            {notification.persistent && (
                              <Badge variant="secondary" className="ml-2">
                                Permanent
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Marquer comme lu</span>
                              </Button>
                            )}
                            {!notification.persistent && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Supprimer</span>
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                  {unreadNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune notification non lue</div>
                  ) : (
                    unreadNotifications.map((notification) => (
                      <div key={notification.id} className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mr-2",
                                notification.type === "warning" || notification.type === "error"
                                  ? "bg-destructive"
                                  : notification.type === "success"
                                    ? "bg-green-500"
                                    : "bg-blue-500",
                              )}
                            />
                            <span className="font-medium">{notification.title}</span>
                            <Badge variant="outline" className="ml-2">
                              Nouveau
                            </Badge>
                            {notification.persistent && (
                              <Badge variant="secondary" className="ml-2">
                                Permanent
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Marquer comme lu</span>
                            </Button>
                            {!notification.persistent && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Supprimer</span>
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="read" className="space-y-4">
                  {readNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune notification lue</div>
                  ) : (
                    readNotifications.map((notification) => (
                      <div key={notification.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mr-2",
                                notification.type === "warning" || notification.type === "error"
                                  ? "bg-destructive"
                                  : notification.type === "success"
                                    ? "bg-green-500"
                                    : "bg-blue-500",
                              )}
                            />
                            <span className="font-medium">{notification.title}</span>
                            {notification.persistent && (
                              <Badge variant="secondary" className="ml-2">
                                Permanent
                              </Badge>
                            )}
                          </div>
                          {!notification.persistent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
