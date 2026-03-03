-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_meals_storage" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_meals_storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_meals" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "holidayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_selections" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "weekOffset" INTEGER NOT NULL DEFAULT 0,
    "dayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,

    CONSTRAINT "user_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pending_users_email_key" ON "pending_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_meals_storage_weekKey_key" ON "weekly_meals_storage"("weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "day_meals_day_weekKey_mealId_key" ON "day_meals"("day", "weekKey", "mealId");

-- CreateIndex
CREATE UNIQUE INDEX "user_selections_userId_dayId_weekKey_key" ON "user_selections"("userId", "dayId", "weekKey");

-- AddForeignKey
ALTER TABLE "day_meals" ADD CONSTRAINT "day_meals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_selections" ADD CONSTRAINT "user_selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_selections" ADD CONSTRAINT "user_selections_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
