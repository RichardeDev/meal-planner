import { type NextRequest, NextResponse } from "next/server"
import { readData } from "@/lib/json-utils"

// GET /api/users/pending - Récupérer tous les utilisateurs en attente
export async function GET(request: NextRequest) {
  try {
    const data = await readData()
    return NextResponse.json(data.pendingUsers || [])
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs en attente" }, { status: 500 })
  }
}
