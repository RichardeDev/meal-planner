"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import type { User } from "@/lib/data"
import NotificationIcon from "@/components/notification-icon"
import AdminNav from "@/components/admin-nav"
import { LogOut } from "lucide-react"
import { useSession } from "./session-provider"

export default function UserHeader() {
  const router = useRouter()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const {user, logout } = useSession()

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true)
  }

  const handleLogout = () => {
    setIsLogoutDialogOpen(false)

    logout()

    toast.success("Déconnexion réussie", {
      description: "À bientôt!",
    })

    router.push("/")
  }

  const cancelLogout = () => {
    setIsLogoutDialogOpen(false)
  }

  return (
    <>
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 border-b">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg">
              Planifier vos Repas
            </Link>
          </div>
            {user?.role === "admin" && <AdminNav />}
          <div className="flex items-center gap-4">
            {user?.name && <label className="text-sm">Bonjour, {user.name}</label>}
            <NotificationIcon />
            <Button variant="ghost" size="icon" onClick={handleLogoutClick} title="Déconnexion">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Popup de confirmation de déconnexion */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation de déconnexion</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Toutes les modifications non enregistrées seront perdues.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={cancelLogout}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Déconnexion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
