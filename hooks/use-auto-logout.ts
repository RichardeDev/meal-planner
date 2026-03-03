"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type UseAutoLogoutOptions = {
  inactivityTimeout?: number
  warningTimeout?: number
  onLogout?: () => void
  onWarning?: () => void
}

const clearAuthCookies = () => {
  document.cookie = "authToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
  document.cookie = "userRole=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT"
}

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

  useEffect(() => {
    setIsAuthenticated(isUserAuthenticated())
  }, [])

  const resetTimers = useCallback(() => {
    if (!isAuthenticated) return

    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (remainingTimerRef.current) clearInterval(remainingTimerRef.current)

    setShowWarning(false)

    warningTimerRef.current = setTimeout(() => {
      if (!isUserAuthenticated()) {
        return
      }

      setShowWarning(true)
      setRemainingTime(Math.floor(warningTimeout / 1000))

      if (onWarning) onWarning()

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

    logoutTimerRef.current = setTimeout(() => {
      handleLogout()
    }, inactivityTimeout)
  }, [inactivityTimeout, warningTimeout, onWarning, isAuthenticated])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user")

    clearAuthCookies()

    setIsAuthenticated(false)

    if (onLogout) onLogout()

    toast.info("Session expirée", {
      description: "Vous avez été déconnecté en raison d'une inactivité prolongée.",
    })

    router.push("/")
  }, [router, onLogout])

  const cancelAutoLogout = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    if (!isAuthenticated) return

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    const handleUserActivity = () => {
      if (isUserAuthenticated()) {
        resetTimers()
      } else {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
        if (remainingTimerRef.current) clearInterval(remainingTimerRef.current)
        setIsAuthenticated(false)
      }
    }

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    resetTimers()

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })

      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (remainingTimerRef.current) clearInterval(remainingTimerRef.current)
    }
  }, [resetTimers, isAuthenticated])

  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = isUserAuthenticated()
      if (authStatus !== isAuthenticated) {
        setIsAuthenticated(authStatus)
      }
    }

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
