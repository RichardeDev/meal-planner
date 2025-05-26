"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Coffee } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function AdminNav() {
  const pathname = usePathname()
  const [pendingUsersCount, setPendingUsersCount] = useState(0)

  useEffect(() => {
    // Récupérer le nombre d'utilisateurs en attente
    const fetchPendingUsers = async () => {
      try {
        const response = await fetch("/api/users/pending")
        if (response.ok) {
          const data = await response.json()
          setPendingUsersCount(data.length)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs en attente:", error)
      }
    }

    fetchPendingUsers()

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchPendingUsers, 30000)

    return () => clearInterval(interval)
  }, [])

  const navItems = [
    {
      title: "Planning",
      href: "/admin/dashboard/planning",
      icon: Calendar,
    },
    {
      title: "Repas",
      href: "/admin/dashboard/meals",
      icon: Coffee,
    },
    {
      title: "Utilisateurs",
      href: "/admin/dashboard/users",
      icon: Users,
      badge: pendingUsersCount > 0 ? pendingUsersCount : null,
    },
  ]

  return (
    <div className="flex space-x-2">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "default" : "ghost"}
          className="flex items-center gap-2 relative"
          asChild
        >
          <Link href={item.href}>
            <item.icon className="h-4 w-4" />
            {item.title}
            {item.badge && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        </Button>
      ))}
    </div>
  )
}
