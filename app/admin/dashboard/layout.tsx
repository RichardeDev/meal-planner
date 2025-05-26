import type React from "react"
import UserHeader from "@/components/user-header"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <UserHeader />
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
