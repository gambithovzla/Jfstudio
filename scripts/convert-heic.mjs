import convert from "heic-convert";
import sharp from "sharp";
import { readdir, readFile, mkdir } from "fs/promises";
import { join, extname } from "path";

const PUBLIC = join(import.meta.dirname, "..", "public");
const OUT = join(PUBLIC, "images");
const MAX_WIDTH = 1200;
const THUMB_WIDTH = 400;

async function run() {
  await mkdir(OUT, { recursive: true });

  const files = (await readdir(PUBLIC))
    .filter((f) => extname(f).toLowerCase() === ".heic")
    .sort();

  console.log(`Found ${files.length} HEIC files`);

  for (let i = 0; i < files.length; i++) {
    const idx = String(i + 1).padStart(2, "0");
    const src = files[i];
    console.log(`[${idx}/${files.length}] ${src} → gallery-${idx}.webp`);

    try {
      const inputBuffer = await readFile(join(PUBLIC, src));
      const jpegBuffer = await convert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 0.9,
      });

      await sharp(Buffer.from(jpegBuffer))
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(join(OUT, `gallery-${idx}.webp`));

      await sharp(Buffer.from(jpegBuffer))
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(join(OUT, `gallery-${idx}-thumb.webp`));
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  console.log("\nDone!");
}

run().catch(console.error);
