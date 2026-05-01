import sharp from "sharp";
import { readdir, mkdir } from "fs/promises";
import { join, extname } from "path";

const PUBLIC = join(import.meta.dirname, "..", "public");
const OUT = join(PUBLIC, "images");

const RENAME_MAP = {
  "IMG_0837.PNG": "johanna-hero",
  "4463EA72-2DE4-478C-8BE3-D7F1E999497F.JPG.jpeg": "johanna-portrait",
  "59C162B2-5607-4CF9-8ECA-F8810C7C250B.JPG.jpeg": "johanna-portrait-alt",
  "EE204B03-EB99-44B0-9E3B-C7F6942F69DA.JPG.jpeg": "johanna-seated",
  "IMG_1024.JPG.jpeg": "johanna-conferencia",
};

const LOGO_FILE = "7B196811-5B98-49B5-AEFF-9AE4F45AC641.PNG";

const MAX_WIDTH = 1200;
const THUMB_WIDTH = 400;
const QUALITY = 80;

async function convert() {
  await mkdir(OUT, { recursive: true });

  const files = await readdir(PUBLIC);

  // Logo: keep as PNG (transparency)
  if (files.includes(LOGO_FILE)) {
    console.log("Logo → logo-jf.png");
    await sharp(join(PUBLIC, LOGO_FILE))
      .resize({ width: 200, withoutEnlargement: true })
      .png({ quality: 90 })
      .toFile(join(OUT, "logo-jf.png"));
  }

  // Named files → WebP
  for (const [src, name] of Object.entries(RENAME_MAP)) {
    if (!files.includes(src)) {
      console.log(`  SKIP (not found): ${src}`);
      continue;
    }
    console.log(`${src} → ${name}.webp`);
    await sharp(join(PUBLIC, src))
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(join(OUT, `${name}.webp`));
  }

  // HEIC files → gallery-NN.webp + gallery-NN-thumb.webp
  const heicFiles = files
    .filter((f) => extname(f).toLowerCase() === ".heic")
    .sort();

  for (let i = 0; i < heicFiles.length; i++) {
    const idx = String(i + 1).padStart(2, "0");
    const src = heicFiles[i];
    console.log(`${src} → gallery-${idx}.webp`);

    try {
      await sharp(join(PUBLIC, src))
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(join(OUT, `gallery-${idx}.webp`));

      await sharp(join(PUBLIC, src))
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(join(OUT, `gallery-${idx}-thumb.webp`));
    } catch (err) {
      console.error(`  ERROR converting ${src}: ${err.message}`);
    }
  }

  console.log("\nDone! Converted images are in public/images/");
}

convert().catch(console.error);
