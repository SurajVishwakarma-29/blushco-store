import { Prisma } from "@prisma/client";

import { ApiError, created, fail } from "@/lib/backend/api";
import { getAuthContext, requireSignedIn } from "@/lib/backend/auth";
import { createExternalReference, inrMinorToDisplay, normalizeCheckoutItems } from "@/lib/backend/commerce";
import { buildSnapshotFromCart } from "@/lib/backend/checkout";
import { ensureUserExists } from "@/lib/backend/users";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    const body = (await request.json()) as {
      items?: unknown;
      idempotencyKey?: string;
      addressId?: string;
    };

    const normalizedItems = normalizeCheckoutItems(body.items);
    const idempotencyKey = body.idempotencyKey?.trim();
    const addressId = body.addressId?.trim();

    await ensureUserExists(prisma, {
      userId,
      email: auth.email,
    });

    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile?.age) {
      throw new ApiError(400, "PROFILE_INCOMPLETE", "Please complete your profile (age) before checkout.");
    }

    if (!addressId) {
      throw new ApiError(400, "ADDRESS_REQUIRED", "Please select a shipping address before checkout.");
    }

    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      throw new ApiError(404, "ADDRESS_NOT_FOUND", "Selected shipping address was not found.");
    }

    if (idempotencyKey) {
      const existing = await prisma.paymentSession.findFirst({
        where: {
          userId,
          idempotencyKey,
        },
      });

      if (existing) {
        return created({
          paymentSessionId: existing.id,
          externalReference: existing.externalReference,
          status: existing.status,
          amountMinor: existing.amountMinor,
          amount: inrMinorToDisplay(existing.amountMinor),
          currency: existing.currency,
        });
      }
    }

    const snapshot = await buildSnapshotFromCart(prisma, normalizedItems);

    const shippingAddressSnapshot = {
      id: address.id,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    };

    const paymentSession = await prisma.paymentSession.create({
      data: {
        userId,
        status: "PENDING",
        provider: "SIMULATED",
        amountMinor: snapshot.totalAmountMinor,
        currency: snapshot.currency,
        cartSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        shippingAddressSnapshot: shippingAddressSnapshot as unknown as Prisma.InputJsonValue,
        idempotencyKey: idempotencyKey || null,
        externalReference: createExternalReference("SIMPAY"),
      },
    });

    return created({
      paymentSessionId: paymentSession.id,
      externalReference: paymentSession.externalReference,
      status: paymentSession.status,
      amountMinor: paymentSession.amountMinor,
      amount: inrMinorToDisplay(paymentSession.amountMinor),
      currency: paymentSession.currency,
      simulationScenarios: ["success", "failed", "pending", "cancelled"],
    });
  } catch (error) {
    return fail(error);
  }
}
