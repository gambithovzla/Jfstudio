-- Galería editable "Trabajos recientes" (landing)
CREATE TABLE "LandingGalleryImage" (
    "id" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingGalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LandingGalleryImage_sortOrder_idx" ON "LandingGalleryImage"("sortOrder");
