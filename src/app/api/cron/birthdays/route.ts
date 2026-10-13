import { NextRequest, NextResponse } from "next/server";

import { rejectUnauthorizedCron } from "@/lib/cron-auth";
import { sendBirthdayBonus } from "@/lib/email";
import { createUniqueBirthdayBonusCode } from "@/lib/birthday-bonus";
import { getBirthdayBonusesForToday, getBirthdayBonusSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDateInZone } from "@/lib/time";
import { isWhatsappCloudConfigured, sendBirthdayMessageViaCloud } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = rejectUnauthorizedCron(request);
  if (unauthorized) return unauthorized;

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

    const code = await createUniqueBirthdayBonusCode(year);

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
