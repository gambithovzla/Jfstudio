import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { getDepositVoucherBuffer } from "@/lib/deposit-storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await context.params;

  const apt = await prisma.appointment.findUnique({
    where: { id },
    select: { depositVoucherKey: true, depositVoucherFilename: true }
  });

  if (!apt?.depositVoucherKey) {
    return NextResponse.json({ error: "Sin comprobante" }, { status: 404 });
  }

  try {
    const { buffer, contentType } = await getDepositVoucherBuffer(apt.depositVoucherKey);
    const filename = apt.depositVoucherFilename || "comprobante";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`
      }
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo leer el archivo" },
      { status: 500 }
    );
  }
}
