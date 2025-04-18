"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NotificationType = "info" | "warning" | "success" | "error"

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  persistent?: boolean
  expiresAt?: number // Timestamp pour l'expiration
  read?: boolean // Indique si la notification a été lue
  createdAt?: number // Date de création
}

type NotificationStore = {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "createdAt">) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  getUnreadCount: () => number
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => {
          // Générer un ID unique
          const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

          // Vérifier si une notification avec le même message existe déjà
          const exists = state.notifications.some(
            (n) => n.message === notification.message && n.title === notification.title,
          )

          if (exists) {
            return state
          }

          return {
            notifications: [
              ...state.notifications,
              {
                ...notification,
                id,
                read: false,
                createdAt: Date.now(),
              },
            ],
          }
        }),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
        })),
      getUnreadCount: () => {
        return get().notifications.filter((notification) => !notification.read).length
      },
    }),
    {
      name: "meal-planner-notifications",
      // Ne stocker que les notifications persistantes
      partialize: (state) => ({
        notifications: state.notifications.filter((n) => n.persistent),
      }),
    },
  ),
)

// Fonction utilitaire pour ajouter une notification
export function addNotification(
  type: NotificationType,
  title: string,
  message: string,
  options?: { persistent?: boolean; expiresInMs?: number },
) {
  const { persistent, expiresInMs } = options || {}

  const notification: Omit<Notification, "id" | "createdAt"> = {
    type,
    title,
    message,
    persistent,
    read: false,
  }

  // Ajouter une date d'expiration si spécifiée
  if (expiresInMs) {
    notification.expiresAt = Date.now() + expiresInMs
  }

  useNotificationStore.getState().addNotification(notification)
}
