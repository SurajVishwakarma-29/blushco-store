import { NextRequest } from "next/server";

import { verifyWebhook } from "@clerk/nextjs/webhooks";

import { ApiError, fail, ok } from "@/lib/backend/api";
import { prisma } from "@/lib/prisma";

interface ClerkEmail {
  email_address?: string;
}

interface ClerkUserPayload {
  id?: string;
  first_name?: string;
  last_name?: string;
  email_addresses?: ClerkEmail[];
}

function extractName(payload: ClerkUserPayload) {
  const first = payload.first_name?.trim() ?? "";
  const last = payload.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();

  return full || null;
}

function extractEmail(payload: ClerkUserPayload, userId: string) {
  const primary = payload.email_addresses?.[0]?.email_address?.trim();
  return primary && primary.length > 0 ? primary : `${userId}@blushco.local`;
}

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    const payload = event.data as ClerkUserPayload;

    if (!event.type || !payload?.id) {
      throw new ApiError(400, "INVALID_WEBHOOK_PAYLOAD", "type and data.id are required.");
    }

    const userId = payload.id;

    if (event.type === "user.deleted") {
      const existing = await prisma.user.findUnique({ where: { id: userId } });

      if (!existing) {
        return ok({ received: true, action: "noop", reason: "user_missing" });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          email: `${userId}@deleted.blushco.local`,
          name: null,
        },
      });

      return ok({ received: true, action: "anonymized", userId });
    }

    if (event.type === "user.created" || event.type === "user.updated") {
      const user = await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: extractEmail(payload, userId),
          name: extractName(payload),
        },
        update: {
          email: extractEmail(payload, userId),
          name: extractName(payload),
        },
      });

      return ok({ received: true, action: "upserted", user });
    }

    return ok({ received: true, action: "ignored", type: event.type });
  } catch (error) {
    return fail(error);
  }
}
