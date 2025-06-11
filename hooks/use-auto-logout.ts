"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type UseAutoLogoutOptions = {
  /** Délai d'inactivité avant déconnexion (en millisecondes) */
  inactivityTimeout?: number
  /** Délai avant l'affichage de l'avertissement (en millisecondes) */
  warningTimeout?: number
  /** Fonction à exécuter lors de la déconnexion */
  onLogout?: () => void
  /** Fonction à exécuter lors de l'affichage de l'avertissement */
  onWarning?: () => void
}

// Fonction utilitaire pour supprimer les cookies
const clearAuthCookies = () => {
  document.cookie = "authToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
  document.cookie = "userRole=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
}

// Fonction utilitaire pour vérifier si l'utilisateur est connecté
const isUserAuthenticated = () => {
  try {
    const storedUser = localStorage.getItem("user")
    const authToken = document.cookie.split(";").find((row) => row.trim().startsWith("authToken="))

    return !!(storedUser && authToken)
  } catch (error) {
    return false
  }
}

export function useAutoLogout({
  inactivityTimeout = 60 * 60 * 1000, // 1 heure par défaut
  warningTimeout = 5 * 60 * 1000, // 5 minutes avant la déconnexion
  onLogout,
  onWarning,
}: UseAutoLogoutOptions = {}) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const remainingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Vérifier l'état d'authentification au montage
  useEffect(() => {
    setIsAuthenticated(isUserAuthenticated())
  }, [])

  // Fonction pour réinitialiser les minuteurs
  const resetTimers = useCallback(() => {
    // Ne pas démarrer les minuteurs si l'utilisateur n'est pas authentifié
    if (!isAuthenticated) return

    // Effacer les minuteurs existants
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (remainingTimerRef.current) clearInterval(remainingTimerRef.current)

    // Masquer l'avertissement
    setShowWarning(false)

    // Définir le minuteur d'avertissement
    warningTimerRef.current = setTimeout(() => {
      // Vérifier à nouveau si l'utilisateur est toujours connecté
      if (!isUserAuthenticated()) {
        return
      }

      setShowWarning(true)
      setRemainingTime(Math.floor(warningTimeout / 1000))

      // Appeler la fonction d'avertissement si elle existe
      if (onWarning) onWarning()

      // Mettre à jour le temps restant chaque seconde
      remainingTimerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            if (remainingTimerRef.current) clearInterval(remainingTimerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, inactivityTimeout - warningTimeout)

    // Définir le minuteur de déconnexion
    logoutTimerRef.current = setTimeout(() => {
      handleLogout()
    }, inactivityTimeout)
  }, [inactivityTimeout, warningTimeout, onWarning, isAuthenticated])

  // Fonction de déconnexion complète
  const handleLogout = useCallback(() => {
    // Supprimer l'utilisateur du localStorage
    localStorage.removeItem("user")

    // Supprimer les cookies d'authentification
    clearAuthCookies()

    // Mettre à jour l'état d'authentification
    setIsAuthenticated(false)

    // Appeler la fonction de déconnexion si elle existe
    if (onLogout) onLogout()

    toast.info("Session expirée", {
      description: "Vous avez été déconnecté en raison d'une inactivité prolongée.",
    })

    // Rediriger vers la page d'accueil
    router.push("/")
  }, [router, onLogout])

  // Fonction pour annuler la déconnexion automatique
  const cancelAutoLogout = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  // Configurer les écouteurs d'événements pour suivre l'activité de l'utilisateur
  useEffect(() => {
    // Ne pas configurer les écouteurs si l'utilisateur n'est pas authentifié
    if (!isAuthenticated) return

    // Liste des événements à surveiller
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    // Fonction qui réinitialise les minuteurs lors d'une activité
    const handleUserActivity = () => {
      // Vérifier si l'utilisateur est toujours connecté avant de réinitialiser
      if (isUserAuthenticated()) {
        resetTimers()
      } else {
        // Si l'utilisateur n'est plus connecté, nettoyer les minuteurs
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
        if (remainingTimerRef.current) clearInterval(remainingTimerRef.current)
        setIsAuthenticated(false)
      }
    }

    // Ajouter les écouteurs d'événements
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Initialiser les minuteurs
    resetTimers()

    // Nettoyer les écouteurs d'événements et les minuteurs lors du démontage
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })

      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (remainingTimerRef.current) clearInterval(remainingTimerRef.current)
    }
  }, [resetTimers, isAuthenticated])

  // Surveiller les changements d'état d'authentification
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = isUserAuthenticated()
      if (authStatus !== isAuthenticated) {
        setIsAuthenticated(authStatus)
      }
    }

    // Vérifier l'état d'authentification périodiquement
    const authCheckInterval = setInterval(checkAuthStatus, 5000) // Toutes les 5 secondes

    return () => clearInterval(authCheckInterval)
  }, [isAuthenticated])

  return {
    showWarning: isAuthenticated ? showWarning : false,
    remainingTime,
    cancelAutoLogout,
    handleLogout,
    isAuthenticated,
  }
}
