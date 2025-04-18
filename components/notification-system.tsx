"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Info, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isThursdayOrLater } from "@/lib/data"
import { Button } from "@/components/ui/button"

type Notification = {
  id: string
  type: "info" | "warning" | "success" | "error"
  title: string
  message: string
  persistent?: boolean
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    // Notifications par défaut
    const defaultNotifications: Notification[] = [
      {
        id: "selection-rule",
        type: "warning",
        title: "Important",
        message:
          "Les sélections doivent être faites au moins un jour à l'avance. Vous ne pouvez pas sélectionner ou modifier les repas pour aujourd'hui ou les jours passés.",
        persistent: true,
      },
    ]

    // Ajouter la notification pour la semaine prochaine si on est jeudi ou après
    if (isThursdayOrLater()) {
      defaultNotifications.push({
        id: "next-week-selection",
        type: "info",
        title: "Information",
        message:
          "Vous pouvez maintenant faire vos sélections pour la semaine prochaine. Utilisez le bouton 'Semaine suivante' pour accéder aux menus de la semaine prochaine.",
        persistent: true,
      })
    }

    setNotifications(defaultNotifications)
  }, [])

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="w-full bg-background border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
            Notifications ({notifications.length})
          </h3>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Réduire" : "Afficher"}
          </Button>
        </div>

        {expanded && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notifications.map((notification) => (
              <Alert
                key={notification.id}
                variant={notification.type === "warning" || notification.type === "error" ? "destructive" : "default"}
                className="py-2 relative"
              >
                {notification.type === "info" ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle className="text-sm">{notification.title}</AlertTitle>
                <AlertDescription className="text-xs">{notification.message}</AlertDescription>

                {!notification.persistent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 absolute top-1 right-1"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Fermer</span>
                  </Button>
                )}
              </Alert>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
