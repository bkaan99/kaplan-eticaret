-- CreateEnum
CREATE TYPE "PickleIngredientGroup" AS ENUM ('VEGETABLE', 'AROMA');

-- DropIndex
DROP INDEX "CartItem_cartId_variantId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "customization" JSONB,
ADD COLUMN     "customizationKey" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "customization" JSONB;

-- CreateTable
CREATE TABLE "PickleIngredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "group" "PickleIngredientGroup" NOT NULL DEFAULT 'VEGETABLE',
    "description" TEXT,
    "imageUrl" TEXT,
    "pricePerKg" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickleIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickleIngredient_slug_key" ON "PickleIngredient"("slug");

-- CreateIndex
CREATE INDEX "PickleIngredient_isActive_sortOrder_idx" ON "PickleIngredient"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_customizationKey_key" ON "CartItem"("cartId", "variantId", "customizationKey");

