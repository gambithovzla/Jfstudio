import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  if (!process.env.CLERK_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CLERK_SECRET_KEY is required to protect admin routes in production.");
    }

    return { userId: "local-dev", staffId: null };
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const staff = await prisma.staff.findUnique({
    where: { clerkUserId: userId },
    select: { id: true }
  });

  return { userId, staffId: staff?.id ?? null };
}
