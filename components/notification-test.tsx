"use client"

import { Button } from "@/components/ui/button"
import { useNotificationStore } from "@/lib/notification-store"

export default function NotificationTest() {
  const { addNotification } = useNotificationStore()

  const addInfoNotification = () => {
    addNotification({
      type: "info",
      title: "Information",
      message: "Ceci est une notification d'information de test.",
    })
  }

  const addWarningNotification = () => {
    addNotification({
      type: "warning",
      title: "Avertissement",
      message: "Ceci est une notification d'avertissement de test.",
    })
  }

  const addSuccessNotification = () => {
    addNotification({
      type: "success",
      title: "Succès",
      message: "Ceci est une notification de succès de test.",
    })
  }

  const addErrorNotification = () => {
    addNotification({
      type: "error",
      title: "Erreur",
      message: "Ceci est une notification d'erreur de test.",
    })
  }

  const addExpiringNotification = () => {
    addNotification({
      type: "info",
      title: "Notification temporaire",
      message: "Cette notification disparaîtra dans 10 secondes.",
      expiresAt: Date.now() + 10000,
    })
  }

  return (
    <div className="p-4 border rounded-md space-y-4">
      <h3 className="font-medium">Test des notifications</h3>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={addInfoNotification}>
          Info
        </Button>
        <Button size="sm" variant="outline" onClick={addWarningNotification}>
          Avertissement
        </Button>
        <Button size="sm" variant="outline" onClick={addSuccessNotification}>
          Succès
        </Button>
        <Button size="sm" variant="outline" onClick={addErrorNotification}>
          Erreur
        </Button>
        <Button size="sm" variant="outline" onClick={addExpiringNotification}>
          Temporaire (10s)
        </Button>
      </div>
    </div>
  )
}
