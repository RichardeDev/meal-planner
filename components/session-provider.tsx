"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAutoLogout } from "@/hooks/use-auto-logout"
import { SessionWarningDialog } from "@/components/session-warning-dialog"

type SessionContextType = {
  isAuthenticated: boolean
  user: any
  login: (user: any) => void
  logout: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

// Fonction utilitaire pour créer les cookies d'authentification
const setAuthCookies = (user: any) => {
  const authToken = btoa(user.email + ":" + user.password)
  const maxAge = 60 * 60 // 1 heure en secondes (synchronisé avec le timeout de session)

  document.cookie = `authToken=${authToken};path=/;max-age=${maxAge};SameSite=Strict`
  document.cookie = `userRole=${user.role};path=/;max-age=${maxAge};SameSite=Strict`
}

// Fonction utilitaire pour supprimer les cookies d'authentification
const clearAuthCookies = () => {
  document.cookie = "authToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
  document.cookie = "userRole=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
}

// Fonction utilitaire pour vérifier la cohérence entre localStorage et cookies
const validateAuthState = () => {
  try {
    const storedUser = localStorage.getItem("user")
    const authToken = document.cookie.split(";").find((row) => row.trim().startsWith("authToken="))
    const userRole = document.cookie.split(";").find((row) => row.trim().startsWith("userRole="))

    if (storedUser && authToken && userRole) {
      const user = JSON.parse(storedUser)
      const expectedRole = userRole.split("=")[1]

      // Vérifier que le rôle dans le cookie correspond au rôle de l'utilisateur
      return user.role === expectedRole
    }

    return false
  } catch (error) {
    console.error("Erreur lors de la validation de l'état d'authentification:", error)
    return false
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Utiliser le hook de déconnexion automatique
  const { showWarning, remainingTime, cancelAutoLogout, handleLogout } = useAutoLogout({
    inactivityTimeout: 60 * 60 * 1000, // 1 heure
    warningTimeout: 5 * 60 * 1000, // Avertissement 5 minutes avant
    onLogout: () => {
      setIsAuthenticated(false)
      setUser(null)
    },
  })

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    if (validateAuthState()) {
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
        // En cas d'erreur, nettoyer tout
        logout()
      }
    } else {
      // Si l'état n'est pas cohérent, nettoyer tout
      logout()
    }
  }, [])

  // Surveiller les changements dans localStorage et cookies
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        if (!e.newValue) {
          // L'utilisateur a été supprimé du localStorage
          logout()
        } else if (!validateAuthState()) {
          // L'état n'est plus cohérent
          logout()
        }
      }
    }

    // Vérifier périodiquement la cohérence de l'état d'authentification
    const authCheckInterval = setInterval(() => {
      if (isAuthenticated && !validateAuthState()) {
        console.warn("Incohérence détectée dans l'état d'authentification, déconnexion...")
        logout()
      }
    }, 10000) // Toutes les 10 secondes

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(authCheckInterval)
    }
  }, [isAuthenticated])

  const login = (userData: any) => {
    try {
      // Stocker dans localStorage
      localStorage.setItem("user", JSON.stringify(userData))

      // Créer les cookies d'authentification
      setAuthCookies(userData)

      // Mettre à jour l'état
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
      logout()
    }
  }

  const logout = () => {
    try {
      // Supprimer du localStorage
      localStorage.removeItem("user")

      // Supprimer les cookies
      clearAuthCookies()

      // Mettre à jour l'état
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  return (
    <SessionContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
      {isAuthenticated && (
        <SessionWarningDialog
          open={showWarning}
          remainingTime={remainingTime}
          onContinue={cancelAutoLogout}
          onLogout={handleLogout}
        />
      )}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
