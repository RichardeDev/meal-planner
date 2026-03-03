import { prisma } from "../lib/prisma"
import fs from "fs"
import path from "path"
import bcrypt from "bcryptjs"

interface OldData {
  users: Array<{
    id: string
    name: string
    email: string
    password: string
    role: "admin" | "user"
  }>
  pendingUsers?: Array<{
    id: string
    name: string
    email: string
    password: string
    createdAt: string
  }>
  meals: Array<{
    id: string
    name: string
    description: string
  }>
  userSelections: Array<{
    userId: string
    userName: string
    dayId: string
    mealId: string
    weekOffset?: number
    weekKey?: string
  }>
  weeklyMealsStorage: Record<
    string,
    Array<{
      day: string
      date: string
      meals: Array<{
        id: string
        name: string
        description: string
      }>
      isHoliday?: boolean
      holidayName?: string
    }>
  >
  holidays?: Array<{
    id: string
    name: string
    date: string
    recurring?: boolean
  }>
}

async function migrateData() {
  try {
    console.log("🚀 Début de la migration des données...")

    // Lire le fichier data.json
    const dataPath = path.join(process.cwd(), "public", "data.json")

    if (!fs.existsSync(dataPath)) {
      console.log("❌ Fichier data.json non trouvé dans public/")
      console.log("Création d'un fichier de données par défaut...")

      // Créer des données par défaut
      const defaultData = {
        users: [
          {
            id: "admin-1",
            name: "Administrateur",
            email: "admin@example.com",
            password: "admin123",
            role: "admin" as const,
          },
        ],
        pendingUsers: [],
        meals: [
          { id: "meal-1", name: "Salade César", description: "Salade fraîche avec croûtons" },
          { id: "meal-2", name: "Pasta Bolognaise", description: "Pâtes avec sauce bolognaise" },
          { id: "meal-3", name: "Sandwich Jambon", description: "Sandwich au jambon et fromage" },
        ],
        userSelections: [],
        weeklyMealsStorage: {},
        holidays: [],
      }

      fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2))
      console.log("✅ Fichier data.json créé avec des données par défaut")
    }

    const rawData = fs.readFileSync(dataPath, "utf8")
    const oldData: OldData = JSON.parse(rawData)

    console.log("📊 Structure des données détectée:")
    console.log(`- Utilisateurs: ${oldData.users?.length || 0}`)
    console.log(`- Utilisateurs en attente: ${oldData.pendingUsers?.length || 0}`)
    console.log(`- Repas: ${oldData.meals?.length || 0}`)
    console.log(`- Sélections: ${oldData.userSelections?.length || 0}`)
    console.log(`- Stockage hebdomadaire: ${Object.keys(oldData.weeklyMealsStorage || {}).length} semaines`)
    console.log(`- Jours fériés: ${oldData.holidays?.length || 0}`)

    // Afficher le contenu de weeklyMealsStorage pour debug
    console.log("🔍 Debug weeklyMealsStorage:")
    console.log("Type:", typeof oldData.weeklyMealsStorage)
    console.log("Is Array:", Array.isArray(oldData.weeklyMealsStorage))
    console.log("Keys:", Object.keys(oldData.weeklyMealsStorage || {}))

    // Nettoyer la base de données
    console.log("🧹 Nettoyage de la base de données...")
    await prisma.userSelection.deleteMany()
    await prisma.weeklyMealsStorage.deleteMany()
    await prisma.dayMeal.deleteMany()
    await prisma.holiday.deleteMany()
    await prisma.meal.deleteMany()
    await prisma.pendingUser.deleteMany()
    await prisma.user.deleteMany()

    // Migrer les utilisateurs
    console.log("👥 Migration des utilisateurs...")
    const userIdMap = new Map<string, string>() // ancien id -> nouvel id

    if (oldData.users && Array.isArray(oldData.users)) {
      for (const user of oldData.users) {
        // Vérifier si le mot de passe est déjà hashé
        let hashedPassword = user.password
        if (!user.password.startsWith("$2")) {
          hashedPassword = await bcrypt.hash(user.password, 10)
        }

        const createdUser = await prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: user.role,
          },
        })
        userIdMap.set(user.id, createdUser.id)
        console.log(`✅ Utilisateur créé: ${user.name} (${user.email})`)
      }
    }

    // Migrer les utilisateurs en attente
    console.log("⏳ Migration des utilisateurs en attente...")
    if (oldData.pendingUsers && Array.isArray(oldData.pendingUsers)) {
      for (const pendingUser of oldData.pendingUsers) {
        let hashedPassword = pendingUser.password
        if (!pendingUser.password.startsWith("$2")) {
          hashedPassword = await bcrypt.hash(pendingUser.password, 10)
        }

        await prisma.pendingUser.create({
          data: {
            name: pendingUser.name,
            email: pendingUser.email,
            password: hashedPassword,
            createdAt: new Date(pendingUser.createdAt),
          },
        })
        console.log(`✅ Utilisateur en attente créé: ${pendingUser.name}`)
      }
    }

    // Migrer les repas
    console.log("🍽️ Migration des repas...")
    const mealIdMap = new Map<string, string>() // ancien id -> nouvel id

    if (oldData.meals && Array.isArray(oldData.meals)) {
      for (const meal of oldData.meals) {
        const createdMeal = await prisma.meal.create({
          data: {
            name: meal.name,
            description: meal.description || "",
          },
        })
        mealIdMap.set(meal.id, createdMeal.id)
        console.log(`✅ Repas créé: ${meal.name}`)
      }
    }

    // Migrer les jours fériés
    console.log("🎉 Migration des jours fériés...")
    if (oldData.holidays && Array.isArray(oldData.holidays)) {
      for (const holiday of oldData.holidays) {
        await prisma.holiday.create({
          data: {
            name: holiday.name,
            date: new Date(holiday.date),
            recurring: holiday.recurring || false,
          },
        })
        console.log(`✅ Jour férié créé: ${holiday.name}`)
      }
    }

    // Migrer le stockage des repas hebdomadaires - CORRECTION ICI
    console.log("📅 Migration du stockage hebdomadaire...")
    if (oldData.weeklyMealsStorage) {
      // Vérifier si c'est un objet et non null/undefined
      if (typeof oldData.weeklyMealsStorage === "object" && oldData.weeklyMealsStorage !== null) {
        const weekKeys = Object.keys(oldData.weeklyMealsStorage)
        console.log(`Trouvé ${weekKeys.length} semaines à migrer`)

        for (const weekKey of weekKeys) {
          const weekData = oldData.weeklyMealsStorage[weekKey]

          // Vérifier que weekData est un tableau
          if (Array.isArray(weekData)) {
            try {
              await prisma.weeklyMealsStorage.create({
                data: {
                  weekKey,
                  data: weekData as any,
                },
              })
              console.log(`✅ Stockage hebdomadaire créé: ${weekKey}`)
            } catch (error) {
              console.log(`⚠️ Erreur lors de la création du stockage pour ${weekKey}:`, error)
            }
          } else {
            console.log(`⚠️ Données invalides pour la semaine ${weekKey} (pas un tableau)`)
          }
        }
      } else {
        console.log("⚠️ weeklyMealsStorage n'est pas un objet valide")
      }
    } else {
      console.log("⚠️ Aucun stockage hebdomadaire trouvé")
    }

    // Migrer les sélections utilisateur
    console.log("📋 Migration des sélections...")
    if (oldData.userSelections && Array.isArray(oldData.userSelections)) {
      for (const selection of oldData.userSelections) {
        const newUserId = userIdMap.get(selection.userId)
        const newMealId = mealIdMap.get(selection.mealId)

        if (newUserId && newMealId) {
          // Générer une clé de semaine si elle n'existe pas
          const weekKey = selection.weekKey || generateWeekKey(selection.weekOffset || 0)

          try {
            await prisma.userSelection.create({
              data: {
                userId: newUserId,
                userName: selection.userName,
                dayId: selection.dayId,
                mealId: newMealId,
                weekKey: weekKey,
                weekOffset: selection.weekOffset || 0,
              },
            })
            console.log(`✅ Sélection créée pour ${selection.userName}`)
          } catch (error) {
            console.log(`⚠️ Sélection ignorée pour ${selection.userName} (doublon possible)`)
          }
        } else {
          console.log(`⚠️ Sélection ignorée: utilisateur ou repas non trouvé`)
        }
      }
    }

    console.log("🎉 Migration terminée avec succès!")

    // Afficher un résumé
    const userCount = await prisma.user.count()
    const pendingUserCount = await prisma.pendingUser.count()
    const mealCount = await prisma.meal.count()
    const selectionCount = await prisma.userSelection.count()
    const holidayCount = await prisma.holiday.count()
    const storageCount = await prisma.weeklyMealsStorage.count()

    console.log("\n📊 Résumé de la migration:")
    console.log(`- ${userCount} utilisateurs migrés`)
    console.log(`- ${pendingUserCount} utilisateurs en attente migrés`)
    console.log(`- ${mealCount} repas migrés`)
    console.log(`- ${selectionCount} sélections migrées`)
    console.log(`- ${holidayCount} jours fériés migrés`)
    console.log(`- ${storageCount} stockages hebdomadaires migrés`)
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

function generateWeekKey(weekOffset = 0): string {
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)

  monday.setDate(diff + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const startOfYear = new Date(monday.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

  return `${monday.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`
}

// Exécuter la migration
migrateData()
