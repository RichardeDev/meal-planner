import fs from "fs"
import path from "path"

// Chemin vers le fichier JSON
const DATA_FILE_PATH = path.join(process.cwd(), "public", "data.json")

// Type pour les données stockées
export type AppData = {
  users: User[]
  meals: Meal[]
  weeklyMealsStorage: Record<string, DayMeals[]>
  userSelections: UserSelection[]
}

export type User = {
  id: string
  name: string
  email: string
  role: "admin" | "user"
}

export type Meal = {
  id: string
  name: string
  description: string
}

export type DayMeals = {
  day: string
  date: string
  meals: Meal[]
}

export type UserSelection = {
  userId: string
  userName: string
  dayId: string
  mealId: string
}

// Fonction pour lire les données du fichier JSON
export async function readData(): Promise<AppData> {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(DATA_FILE_PATH)) {
      // Si le fichier n'existe pas, créer un fichier avec des données par défaut
      const defaultData: AppData = {
        users: [],
        meals: [],
        weeklyMealsStorage: {},
        userSelections: [],
      }
      await writeData(defaultData)
      return defaultData
    }

    // Lire le fichier
    const data = await fs.promises.readFile(DATA_FILE_PATH, "utf8")
    return JSON.parse(data) as AppData
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier JSON:", error)
    throw new Error("Impossible de lire les données")
  }
}

// Fonction pour écrire les données dans le fichier JSON
export async function writeData(data: AppData): Promise<void> {
  try {
    await fs.promises.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8")
  } catch (error) {
    console.error("Erreur lors de l'écriture dans le fichier JSON:", error)
    throw new Error("Impossible d'écrire les données")
  }
}

// Fonction pour mettre à jour une partie spécifique des données
export async function updateData<K extends keyof AppData>(
  key: K,
  updater: (currentValue: AppData[K]) => AppData[K],
): Promise<void> {
  try {
    const data = await readData()
    data[key] = updater(data[key])
    await writeData(data)
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de ${key}:`, error)
    throw new Error(`Impossible de mettre à jour ${key}`)
  }
}
