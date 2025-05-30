import { type NextRequest, NextResponse } from "next/server"
import { readData, updateData, type Meal } from "@/lib/json-utils"
import { pool } from "@/lib/mysql-utils"


// GET /api/meals - Récupérer tous les repas
export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.query("SELECT * FROM meals")
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erreur lors de la récupération des repas:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    // Validation basique
    if (!name || !description) {
      return NextResponse.json({ error: "Nom et description sont requis" }, { status: 400 })
    }

    // Insérer dans la base de données
    await pool.query(
      "INSERT INTO meals (name, description) VALUES (?, ?)",
      [name, description]
    )

    return NextResponse.json({name, description }, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la création du repas:", error.message)
    return NextResponse.json({ error: "Erreur lors de la création du repas" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params
    const body = await request.json()
    const { name, description } = body

    if (!name || !description) {
      return NextResponse.json({ error: "Nom et description sont requis" }, { status: 400 })
    }

    // Vérifier si le repas existe
    const [existingRows]: any = await pool.query("SELECT * FROM meals WHERE id = ?", [id])
    if (existingRows.length === 0) {
      return NextResponse.json({ error: "Repas non trouvé" }, { status: 404 })
    }

    // Mettre à jour le repas
    await pool.query("UPDATE meals SET name = ?, description = ? WHERE id = ?", [
      name,
      description,
      id,
    ])

    // Mettre à jour dans tous les repas hebdomadaires
    await updateMealInWeeklyMeals(id, name, description)

    return NextResponse.json({ success: true, id, name, description })
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du repas:", error.message)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params

    // Vérifier si le repas est utilisé dans weekly_meals
    const isUsed = await isMealUsed(id)
    if (isUsed) {
      return NextResponse.json(
        { error: "Ce repas est utilisé et ne peut pas être supprimé" },
        { status: 400 }
      )
    }

    // Supprimer le repas
    await pool.query("DELETE FROM meals WHERE id = ?", [id])

    // Supprimer aussi toutes les sélections liées
    await pool.query("DELETE FROM user_selections WHERE meal_id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erreur lors de la suppression du repas:", error.message)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

async function updateMealInWeeklyMeals(mealId: string, name: string, description: string) {
  const [weeks]: any = await pool.query("SELECT week_key, days FROM weekly_meals")

  for (const week of weeks) {
    const days = JSON.parse(week.days)

    let updated = false

    for (const day of days) {
      for (const meal of day.meals) {
        if (meal.id === mealId) {
          meal.name = name
          meal.description = description
          updated = true
        }
      }
    }

    if (updated) {
      await pool.query("UPDATE weekly_meals SET days = ? WHERE week_key = ?", [
        JSON.stringify(days),
        week.week_key,
      ])
    }
  }
}

async function isMealUsed(mealId: string): Promise<boolean> {
  const [selections]: any = await pool.query(
    "SELECT COUNT(*) AS count FROM user_selections WHERE meal_id = ?",
    [mealId]
  )
  return selections[0].count > 0
}