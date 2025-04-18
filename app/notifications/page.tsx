"use client"

import { useState } from "react"
import { useNotificationStore } from "@/lib/notification-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2, ArrowLeft } from "lucide-react"
import UserHeader from "@/components/user-header"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function NotificationsPage() {
  const { notifications, markAsRead, removeNotification, markAllAsRead, clearNotifications } = useNotificationStore()
  const [activeTab, setActiveTab] = useState<string>("all")

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

        <Card>
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
      </main>
    </div>
  )
}
