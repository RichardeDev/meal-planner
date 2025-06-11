"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock } from "lucide-react"

interface SessionWarningDialogProps {
  open: boolean
  remainingTime: number
  onContinue: () => void
  onLogout: () => void
}

export function SessionWarningDialog({ open, remainingTime, onContinue, onLogout }: SessionWarningDialogProps) {
  // Formater le temps restant en minutes et secondes
  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onContinue()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Votre session va expirer
          </DialogTitle>
          <DialogDescription>
            Vous serez déconnecté automatiquement en raison d'inactivité dans{" "}
            <span className="font-medium text-amber-500">
              {minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : ""}{" "}
              {seconds > 0 ? `${seconds} seconde${seconds > 1 ? "s" : ""}` : ""}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Cliquez sur "Continuer la session" pour rester connecté ou "Se déconnecter" pour vous déconnecter maintenant.
        </p>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onLogout}>
            Se déconnecter
          </Button>
          <Button onClick={onContinue}>Continuer la session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
