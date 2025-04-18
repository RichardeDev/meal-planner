"use client"

import { useState, useEffect } from "react"
import { Bell, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuFooter,
} from "@/components/ui/dropdown-menu"
import { useNotificationStore } from "@/lib/notification-store"
import { cn } from "@/lib/utils"
import { isThursdayOrFriday } from "@/lib/data"
import Link from "next/link"

export default function NotificationIcon() {
  const { notifications, markAsRead, markAllAsRead, getUnreadCount, addNotification, removeNotification } =
    useNotificationStore()
  const [open, setOpen] = useState(false)

  const unreadCount = getUnreadCount()
  const unreadNotifications = notifications.filter((notification) => !notification.read)

  // Ajouter les notifications par défaut au chargement
  useEffect(() => {
    // Vérifier si les notifications par défaut existent déjà
    const hasSelectionRule = notifications.some((n) => n.id.includes("selection-rule"))
    const hasNextWeekInfo = notifications.some((n) => n.id.includes("next-week-selection"))

    // Ajouter la notification sur les règles de sélection si elle n'existe pas
    if (!hasSelectionRule) {
      addNotification({
        type: "warning",
        title: "Important",
        message:
          "Les sélections doivent être faites au moins un jour à l'avance. Vous ne pouvez pas sélectionner ou modifier les repas pour aujourd'hui ou les jours passés.",
        persistent: true,
      })
    }

    // Ajouter la notification pour la semaine prochaine si on est jeudi ou vendredi
    if (isThursdayOrFriday()) {
      if (!hasNextWeekInfo) {
        addNotification({
          type: "info",
          title: "Information",
          message:
            "Vous pouvez maintenant faire vos sélections pour la semaine prochaine. Utilisez le bouton 'Semaine suivante' pour accéder aux menus de la semaine prochaine.",
          persistent: true,
        })
      }
    } else {
      // Si ce n'est pas jeudi ou vendredi, supprimer la notification si elle existe
      if (hasNextWeekInfo) {
        const nextWeekNotification = notifications.find((n) => n.id.includes("next-week-selection"))
        if (nextWeekNotification) {
          removeNotification(nextWeekNotification.id)
        }
      }
    }

    // Nettoyer les notifications expirées
    const now = Date.now()
    notifications.forEach((notification) => {
      if (notification.expiresAt && notification.expiresAt < now) {
        removeNotification(notification.id)
      }
    })
  }, [notifications, addNotification, removeNotification])

  const handleNotificationClick = (id: string) => {
    markAsRead(id)
    setOpen(false)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications non lues ({unreadCount})</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleMarkAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {unreadNotifications.length === 0 ? (
          <div className="py-2 px-2 text-sm text-center text-muted-foreground">Aucune notification non lue</div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {unreadNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer bg-muted/50"
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-center w-full">
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
                  <span className="font-medium text-sm">{notification.title}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    Nouveau
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 pl-4">{notification.message}</p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {notifications.length > unreadNotifications.length && (
          <DropdownMenuFooter className="text-center py-2">
            <Button variant="link" size="sm" className="text-xs" asChild>
              <Link href="/notifications">
                <Archive className="h-3 w-3 mr-1" />
                Voir toutes les notifications ({notifications.length})
              </Link>
            </Button>
          </DropdownMenuFooter>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
