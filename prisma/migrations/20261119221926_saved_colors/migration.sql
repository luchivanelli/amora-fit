-- CreateTable
CREATE TABLE "SavedColor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedColor_nameKey_key" ON "SavedColor"("nameKey");

-- Cargar los colores que ya usan los productos (uno por nombre, el más reciente).
INSERT INTO "SavedColor" ("id", "name", "nameKey", "hex", "updatedAt")
SELECT DISTINCT ON (lower(trim("color")))
  gen_random_uuid()::text, trim("color"), lower(trim("color")), "colorHex", CURRENT_TIMESTAMP
FROM "ProductVariant"
WHERE "colorHex" IS NOT NULL AND trim("color") <> ''
ORDER BY lower(trim("color")), "createdAt" DESC;
