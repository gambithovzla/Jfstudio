import { NextRequest, NextResponse } from "next/server";

import { sendBirthdayBonus } from "@/lib/email";
import { getBirthdayBonusesForToday, getBirthdayBonusSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDateInZone } from "@/lib/time";
import { isWhatsappCloudConfigured, sendBirthdayMessageViaCloud } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function generateCode(year: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `JF-${year}-${suffix}`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const settings = await prisma.salonSettings.findUnique({ where: { id: "default" } });
  const timezone = settings?.timezone ?? "America/Lima";

  const bonusSettings = await getBirthdayBonusSettings();
  if (!bonusSettings.enabled) {
    return NextResponse.json({ enabled: false, generated: 0, emailsSent: 0, whatsappSent: 0 });
  }

  const { candidates } = await getBirthdayBonusesForToday(timezone);

  let generated = 0;
  let emailsSent = 0;
  let whatsappSent = 0;
  const errors: string[] = [];

  const today = new Date();
  const expiresAt = new Date(today.getTime() + bonusSettings.validityDays * 24 * 60 * 60 * 1000);
  const expiresLabel = formatDateInZone(expiresAt, timezone);
  const year = today.getUTCFullYear();

  for (const client of candidates) {
    if (client.birthdayBonuses.length > 0) continue;

    let code = generateCode(year);
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.birthdayBonus.findUnique({ where: { code } });
      if (!exists) break;
      code = generateCode(year);
      attempts++;
    }

    let bonus;
    try {
      bonus = await prisma.birthdayBonus.create({
        data: {
          clientId: client.id,
          code,
          discountPercent: bonusSettings.discountPercent,
          expiresAt
        }
      });
      generated++;
    } catch (err) {
      errors.push(`${client.name}: no se pudo crear bono — ${err instanceof Error ? err.message : "error"}`);
      continue;
    }

    if (client.email) {
      try {
        await sendBirthdayBonus({
          to: client.email,
          clientName: client.name,
          discountPercent: bonus.discountPercent,
          code: bonus.code,
          expiresLabel
        });
        await prisma.birthdayBonus.update({
          where: { id: bonus.id },
          data: { emailSentAt: new Date() }
        });
        emailsSent++;
      } catch (err) {
        errors.push(`${client.name}: email fallo — ${err instanceof Error ? err.message : "error"}`);
      }
    }

    if (client.phone && isWhatsappCloudConfigured()) {
      const ok = await sendBirthdayMessageViaCloud({
        to: client.phone,
        clientName: client.name,
        discountPercent: bonus.discountPercent,
        code: bonus.code,
        expiresLabel
      });
      if (ok) {
        await prisma.birthdayBonus.update({
          where: { id: bonus.id },
          data: { whatsappSentAt: new Date() }
        });
        whatsappSent++;
      }
    }
  }

  return NextResponse.json({
    enabled: true,
    generated,
    emailsSent,
    whatsappSent,
    errors,
    whatsappAutoEnabled: isWhatsappCloudConfigured(),
    note: isWhatsappCloudConfigured()
      ? undefined
      : "WhatsApp en modo manual: usa /admin/cumpleanos para enviar."
  });
}
