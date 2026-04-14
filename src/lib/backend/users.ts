import type { PrismaClient } from "@prisma/client";

export async function ensureUserExists(
  prisma: PrismaClient,
  params: { userId: string; email?: string | null; name?: string | null },
) {
  const email = params.email?.trim() || `${params.userId}@blushco.local`;

  return prisma.user.upsert({
    where: { id: params.userId },
    create: {
      id: params.userId,
      email,
      name: params.name?.trim() || null,
    },
    update: {
      email,
      name: params.name?.trim() || undefined,
    },
  });
}
