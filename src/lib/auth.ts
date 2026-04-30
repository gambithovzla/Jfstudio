import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export type AuthContext = {
  userId: string | null;
  staffId: string | null;
  role: UserRole | null;
  needsClerkSetup: boolean;
};

const LOCAL_DEV_CONTEXT: AuthContext = {
  userId: "local-dev",
  staffId: null,
  role: UserRole.ADMIN,
  needsClerkSetup: false
};

const NOT_CONFIGURED_CONTEXT: AuthContext = {
  userId: null,
  staffId: null,
  role: null,
  needsClerkSetup: true
};

export async function getAuthContext(): Promise<AuthContext> {
  if (!process.env.CLERK_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      return NOT_CONFIGURED_CONTEXT;
    }

    return LOCAL_DEV_CONTEXT;
  }

  const { userId } = await auth();

  if (!userId) {
    return { userId: null, staffId: null, role: null, needsClerkSetup: false };
  }

  const staff = await prisma.staff.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true, isActive: true }
  });

  if (!staff || !staff.isActive) {
    return { userId, staffId: null, role: null, needsClerkSetup: false };
  }

  return { userId, staffId: staff.id, role: staff.role, needsClerkSetup: false };
}

export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext();

  if (context.needsClerkSetup) {
    return context;
  }

  if (!context.userId) {
    redirect("/sign-in");
  }

  return context;
}

export async function requireRole(...roles: UserRole[]): Promise<AuthContext> {
  const context = await requireAuth();

  if (context.needsClerkSetup) {
    return context;
  }

  if (!context.role || !roles.includes(context.role)) {
    throw new Error("No tienes permisos para esta accion.");
  }

  return context;
}

export async function requireAdmin(): Promise<AuthContext> {
  return requireRole(UserRole.ADMIN);
}

export async function requireStaff(): Promise<AuthContext> {
  return requireRole(UserRole.ADMIN, UserRole.STYLIST, UserRole.RECEPTIONIST);
}
