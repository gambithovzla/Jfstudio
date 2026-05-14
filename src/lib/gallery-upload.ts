import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { landingContent } from "@/content/landing";

const UPLOAD_SUBDIR = ["uploads", "gallery"] as const;
const MAX_BYTES = 8 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

export function galleryPublicDir(): string {
  return path.join(process.cwd(), "public", ...UPLOAD_SUBDIR);
}

export function isManagedUploadPath(src: string): boolean {
  return src.startsWith("/uploads/gallery/");
}

export async function saveGalleryUpload(params: { buffer: Buffer; mime: string }): Promise<string> {
  const baseMime = params.mime.toLowerCase().split(";")[0].trim();
  const ext = MIME_EXT[baseMime];
  if (!ext) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WebP.");
  }
  if (params.buffer.length > MAX_BYTES) {
    throw new Error("La imagen supera el tamaño máximo (8 MB).");
  }

  const dir = galleryPublicDir();
  await fs.mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const abs = path.join(dir, filename);
  await fs.writeFile(abs, params.buffer);

  return `/${UPLOAD_SUBDIR.join("/")}/${filename}`;
}

export async function removeGalleryFileIfManaged(src: string): Promise<void> {
  if (!isManagedUploadPath(src)) return;
  const abs = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  try {
    await fs.unlink(abs);
  } catch {
    // ya borrado o no existe
  }
}

/** Rutas relativas permitidas al agregar por URL (sin subir archivo). */
export function assertSafeGallerySrcPath(src: string): string {
  const trimmed = src.trim();
  if (!trimmed.startsWith("/") || trimmed.includes("..") || trimmed.includes("\\")) {
    throw new Error("Ruta de imagen no válida.");
  }
  if (!trimmed.startsWith("/images/") && !trimmed.startsWith("/uploads/gallery/")) {
    throw new Error("La ruta debe empezar por /images/ o /uploads/gallery/.");
  }
  return trimmed;
}

export function defaultLandingGallerySeed() {
  return landingContent.gallery.images.map((img, sortOrder) => ({
    src: img.src,
    alt: img.alt,
    sortOrder
  }));
}
