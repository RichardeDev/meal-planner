
import { type NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/json-utils";
import { sendEmail } from "@/lib/email-utils";

import { pool } from "@/lib/mysql-utils"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const resolvedParams = await context.params
    const { email } = resolvedParams
    const decodedEmail = decodeURIComponent(email)

    const [rows]: any = await pool.query("SELECT * FROM users WHERE email = ?", [
      decodedEmail,
    ])

    if (rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}
