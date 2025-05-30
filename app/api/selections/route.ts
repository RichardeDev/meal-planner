import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type UserSelection } from "@/lib/json-utils"

import { pool } from "@/lib/mysql-utils"

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const userId = searchParams.get("userId")
    const dayId = searchParams.get("dayId")
    const weekOffsetStr = searchParams.get("weekOffset")

    let query = "SELECT * FROM user_selections WHERE 1=1"
    const queryParams: any[] = []

    if (userId) {
      query += " AND userId = ?"
      queryParams.push(userId)
    }

    if (dayId) {
      query += " AND dayId = ?"
      queryParams.push(dayId)
    }

    if (weekOffsetStr !== null && weekOffsetStr !== "") {
      const weekOffset = parseInt(weekOffsetStr, 10)
      query += " AND weekOffset = ?"
      queryParams.push(weekOffset)
    } else {
      // Si non spécifié, charger la semaine actuelle (weekOffset = 0)
      query += " AND (weekOffset = 0 OR weekOffset IS NULL)"
    }

    const [rows] = await pool.query(query, queryParams)

    return NextResponse.json(rows)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des sélections:", error.message)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userName, dayId, mealId, weekOffset = 0 } = body

    if (!userId || !userName || !dayId || !mealId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const success = await selectMeal(userId, userName, dayId, mealId, weekOffset)

    if (!success) {
      return NextResponse.json({ error: "Échec de la sélection du repas" }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la création d'une sélection:", error.message)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

async function selectMeal(
  userId: string,
  userName: string,
  dayId: string,
  mealId: string,
  weekOffset: number = 0
): Promise<boolean> {
  try {
    const [existing]: any = await pool.query(
      "SELECT * FROM user_selections WHERE userId = ? AND dayId = ? AND weekOffset = ?",
      [userId, dayId, weekOffset]
    )

    if (existing.length > 0) {
      // Mettre à jour la sélection existante
      await pool.query(
        "UPDATE user_selections SET mealId = ?, updatedAt = NOW() WHERE userId = ? AND dayId = ? AND weekOffset = ?",
        [mealId, userId, dayId, weekOffset]
      )
    } else {
      // Créer une nouvelle sélection
      await pool.query(
        "INSERT INTO user_selections (userId, userName, dayId, mealId, weekOffset, selectedAt) VALUES (?, ?, ?, ?, ?, NOW())",
        [userId, userName, dayId, mealId, weekOffset]
      )
    }

    return true
  } catch (error: any) {
    console.error("Erreur dans la fonction selectMeal:", error.message)
    return false
  }
}