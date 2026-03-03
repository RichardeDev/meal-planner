# Meal Planner

Ce projet est une application de planification de repas avec une interface utilisateur pour les utilisateurs et un tableau de bord d'administration. Il utilise Next.js, Prisma ORM avec PostgreSQL, et gère les utilisateurs, les repas, les jours fériés et les sélections hebdomadaires.

## 🚀 Guide d'Installation et de Lancement

Suivez ces étapes pour installer et lancer le projet sur votre machine.

### Prérequis

Assurez-vous d'avoir les éléments suivants installés :

*   [Node.js](https://nodejs.org/en/) (version 18 ou supérieure)
*   [npm](https://www.npmjs.com/) (généralement inclus avec Node.js)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (pour la base de données PostgreSQL)

### 1. Installation

1.  **Cloner le dépôt :**
    \`\`\`bash
    git clone <URL_DE_VOTRE_DEPOT>
    cd meal-planner
    \`\`\`

2.  **Installer les dépendances :**
    \`\`\`bash
    npm install
    \`\`\`

### 2. Configuration

1.  **Variables d'environnement :**
    Créez un fichier `.env` à la racine du projet (s'il n'existe pas) et configurez les variables suivantes. Remplacez les valeurs par défaut par les vôtres.

    \`\`\`env
    # Database Configuration (for PostgreSQL with Prisma)
    DATABASE_URL="postgresql://user:password@localhost:5432/mealplanner?schema=public"

    # Email Configuration (for Resend or Nodemailer)
    RESEND_API_KEY=your_resend_api_key_here
    ADMIN_EMAIL=admin@example.com
    SUPPORT_EMAIL=support@example.com

    # Public URL for your application (used for emails, etc.)
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

    # API Credentials (if your API requires authentication)
    API_USER=your_api_username
    API_PASSWORD=your_api_password
    \`\`\`

2.  **Démarrer la base de données PostgreSQL :**
    Utilisez Docker Compose pour lancer le conteneur PostgreSQL.
    \`\`\`bash
    docker-compose up -d
    \`\`\`
    *(Vous pouvez vérifier que le conteneur est en cours d'exécution avec `docker-compose ps`)*

### 3. Lancement du Projet

1.  **Appliquer les migrations de la base de données :**
    Cela créera les tables dans votre base de données PostgreSQL.
    \`\`\`bash
    npx prisma migrate dev --name init
    \`\`\`

2.  **Générer le client Prisma :**
    \`\`\`bash
    npx prisma generate
    \`\`\`

3.  **Migrer les données initiales (si `data.json` existe) :**
    Cela importera les données de `public/data.json` dans votre base de données.
    \`\`\`bash
    npm run db:seed
    \`\`\`

4.  **Démarrer l'application Next.js :**
    \`\`\`bash
    npm run dev
    \`\`\`

L'application devrait maintenant être accessible à l'adresse `http://localhost:3000`.

---

## 🛠️ Outils Utiles (Optionnel)

*   **Prisma Studio :** Pour visualiser et gérer les données de votre base de données.
    \`\`\`bash
    npx prisma studio
