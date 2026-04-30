import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { prisma } from "@/lib/prisma";

type ClerkUserEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses?: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    public_metadata?: Record<string, unknown>;
  };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pickEmail(event: ClerkUserEvent): string | null {
  const emails = event.data.email_addresses ?? [];
  const primaryId = event.data.primary_email_address_id;
  const primary = primaryId ? emails.find((entry) => entry.id === primaryId) : null;
  return primary?.email_address ?? emails[0]?.email_address ?? null;
}

function pickName(event: ClerkUserEvent): string {
  const first = event.data.first_name?.trim();
  const last = event.data.last_name?.trim();

  if (first && last) {
    return `${first} ${last}`;
  }

  return first || last || pickEmail(event) || "Usuario sin nombre";
}

function pickRole(event: ClerkUserEvent): UserRole {
  const metadata = event.data.public_metadata ?? {};
  const candidate = typeof metadata.role === "string" ? metadata.role.toUpperCase() : null;

  if (candidate && (Object.values(UserRole) as string[]).includes(candidate)) {
    return candidate as UserRole;
  }

  return UserRole.RECEPTIONIST;
}

export async function POST(request: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Headers svix faltantes" }, { status: 400 });
  }

  const payload = await request.text();
  const webhook = new Webhook(secret);

  let event: ClerkUserEvent;

  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature
    }) as ClerkUserEvent;
  } catch (error) {
    console.error("[clerk-webhook] firma invalida", error);
    return NextResponse.json({ error: "Firma invalida" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const email = pickEmail(event);
    const name = pickName(event);
    const role = pickRole(event);

    await prisma.staff.upsert({
      where: { clerkUserId: event.data.id },
      update: {
        name,
        email,
        role
      },
      create: {
        clerkUserId: event.data.id,
        name,
        email,
        role,
        isActive: true,
        color: "#0f766e"
      }
    });
  }

  if (event.type === "user.deleted") {
    await prisma.staff.updateMany({
      where: { clerkUserId: event.data.id },
      data: { isActive: false }
    });
  }

  return NextResponse.json({ ok: true });
}
