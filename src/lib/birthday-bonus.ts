import { prisma } from "@/lib/prisma";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBirthdayBonusCode(year: number, random: () => number = Math.random) {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  }
  return `JF-${year}-${suffix}`;
}

export async function createUniqueBirthdayBonusCode(year: number) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateBirthdayBonusCode(year);
    const exists = await prisma.birthdayBonus.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("No se pudo generar un código de bono único.");
}