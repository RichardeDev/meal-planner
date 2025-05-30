import { type NextRequest, NextResponse } from "next/server"
import { readData } from "@/lib/json-utils"
import { pool } from "@/lib/mysql-utils"

export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role FROM pending_users")
    return NextResponse.json(rows)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des utilisateurs en attente:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}
