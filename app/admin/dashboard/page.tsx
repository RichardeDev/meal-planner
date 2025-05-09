import { redirect } from "next/navigation"

// Rediriger vers la page de planning par défaut
export default function AdminDashboard() {
  redirect("/admin/dashboard/planning")
}