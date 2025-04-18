"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Info, X, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useNotificationStore } from "@/lib/notification-store"

export default function AdminNotificationSystem() {
  const { notifications, removeNotification, addNotification, markAsRead } = useNotificationStore()
  const [expanded, setExpanded] = useState(true)

  // Ajouter les notifications par défaut au chargement
  useEffect(() => {
    // Vérifier si les notifications par défaut existent déjà
    const hasAdminRule = notifications.some((n) => n.id.includes("admin-rule"))

    // Ajouter la notification sur les règles d'administration si elle n'existe pas
    if (!hasAdminRule) {
      addNotification({
        type: "warning",
        title: "Important - Administration",
        message:
          "En tant qu'administrateur, vous pouvez modifier les repas pour les jours futurs uniquement. Les modifications pour le jour même et les jours passés sont désactivées.",
        persistent: true,
      })
    }

    // Nettoyer les notifications expirées
    const now = Date.now()
    notifications.forEach((notification) => {
      if (notification.expiresAt && notification.expiresAt < now) {
        removeNotification(notification.id)
      }
    })
  }, [notifications, addNotification, removeNotification])

  // Ne rien afficher s'il n'y a pas de notifications
  if (notifications.length === 0) {
    return null
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  return (
    <div className="w-full bg-background border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
            Notifications administrateur ({notifications.length})
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
                className={`py-2 relative ${notification.read ? "opacity-75" : ""}`}
              >
                {notification.type === "info" ? (
                  <Info className="h-4 w-4" />
                ) : notification.type === "success" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="text-sm">{notification.title}</AlertTitle>
                <AlertDescription className="text-xs">{notification.message}</AlertDescription>

                <div className="absolute top-1 right-1 flex space-x-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Marquer comme lu"
                    >
                      <Check className="h-3 w-3" />
                      <span className="sr-only">Marquer comme lu</span>
                    </Button>
                  )}
                  {!notification.persistent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeNotification(notification.id)}
                      title="Supprimer"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Fermer</span>
                    </Button>
                  )}
                </div>
              </Alert>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
