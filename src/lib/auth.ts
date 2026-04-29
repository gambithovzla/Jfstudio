import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  if (!process.env.CLERK_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      return {
        userId: null,
        staffId: null,
        needsClerkSetup: true
      };
    }

    return { userId: "local-dev", staffId: null, needsClerkSetup: false };
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const staff = await prisma.staff.findUnique({
    where: { clerkUserId: userId },
    select: { id: true }
  });

  return { userId, staffId: staff?.id ?? null, needsClerkSetup: false };
}
