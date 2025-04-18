import { type NextRequest, NextResponse } from "next/server"
import { readData } from "@/lib/json-utils"

// GET /api/users/[email] - Récupérer un utilisateur par email
export async function GET(request: NextRequest, { params }: { params: { email: string } }) {
  try {
    const { email } = params
    const data = await readData()
    const user = data.users.find((user) => user.email === email)
    
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération de l'utilisateur" }, { status: 500 })
  }
}
