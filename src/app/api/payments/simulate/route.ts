import { Prisma } from "@prisma/client";
import { ApiError, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireSignedIn } from "@/lib/backend/auth";
import { assertScenario, inrMinorToDisplay, toCartSnapshot } from "@/lib/backend/commerce";
import { prisma } from "@/lib/prisma";

const scenarioToStatus = {
  success: "SUCCESS",
  failed: "FAILED",
  pending: "PENDING",
  cancelled: "CANCELLED",
} as const;

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const requesterId = requireSignedIn(auth);

    const body = (await request.json()) as {
      paymentSessionId?: string;
      scenario?: string;
      idempotencyKey?: string;
    };

    const paymentSessionId = body.paymentSessionId?.trim();

    if (!paymentSessionId) {
      throw new ApiError(400, "INVALID_PAYMENT_SESSION", "paymentSessionId is required.");
    }

    const scenario = assertScenario(body.scenario);
    const nextStatus = scenarioToStatus[scenario];
    const idempotencyKey = body.idempotencyKey?.trim() || null;

    const existingSession = await prisma.paymentSession.findUnique({
      where: { id: paymentSessionId },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!existingSession) {
      throw new ApiError(404, "PAYMENT_SESSION_NOT_FOUND", "Payment session was not found.");
    }

    if (auth.role !== "ADMIN" && existingSession.userId !== requesterId) {
      throw new ApiError(403, "FORBIDDEN", "You cannot update this payment session.");
    }

    if (scenario !== "success") {
      if (existingSession.orderId) {
        throw new ApiError(
          409,
          "PAYMENT_ALREADY_CAPTURED",
          "Cannot change payment state after an order has been created.",
        );
      }

      if (existingSession.status === nextStatus) {
        return ok({
          paymentSessionId: existingSession.id,
          status: existingSession.status,
          scenario,
          amountMinor: existingSession.amountMinor,
          amount: inrMinorToDisplay(existingSession.amountMinor),
          currency: existingSession.currency,
          orderId: null,
          replay: true,
        });
      }

      if (existingSession.status !== "PENDING") {
        throw new ApiError(
          409,
          "INVALID_PAYMENT_TRANSITION",
          `Cannot move payment from ${existingSession.status} to ${nextStatus}.`,
        );
      }

      const updated = await prisma.paymentSession.update({
        where: { id: existingSession.id },
        data: {
          status: nextStatus,
          scenario,
          resolvedAt: nextStatus === "PENDING" ? null : new Date(),
          idempotencyKey,
        },
      });

      return ok({
        paymentSessionId: updated.id,
        status: updated.status,
        scenario,
        amountMinor: updated.amountMinor,
        amount: inrMinorToDisplay(updated.amountMinor),
        currency: updated.currency,
        orderId: null,
        replay: false,
      });
    }

    const completed = await prisma.$transaction(async (tx) => {
      const session = await tx.paymentSession.findUnique({
        where: { id: paymentSessionId },
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!session) {
        throw new ApiError(404, "PAYMENT_SESSION_NOT_FOUND", "Payment session was not found.");
      }

      if (session.order) {
        return {
          replay: true,
          session,
          order: session.order,
        };
      }

      if (session.status !== "PENDING") {
        throw new ApiError(
          409,
          "INVALID_PAYMENT_TRANSITION",
          `Cannot move payment from ${session.status} to SUCCESS.`,
        );
      }

      const lock = await tx.paymentSession.updateMany({
        where: {
          id: session.id,
          status: "PENDING",
          orderId: null,
        },
        data: {
          status: "SUCCESS",
          scenario: "success",
          resolvedAt: new Date(),
          idempotencyKey: idempotencyKey ?? session.id,
        },
      });

      if (lock.count === 0) {
        const replaySession = await tx.paymentSession.findUnique({
          where: { id: session.id },
          include: {
            order: {
              include: {
                items: true,
              },
            },
          },
        });

        if (!replaySession) {
          throw new ApiError(404, "PAYMENT_SESSION_NOT_FOUND", "Payment session was not found.");
        }

        return {
          replay: true,
          session: replaySession,
          order: replaySession.order,
        };
      }

      const snapshot = toCartSnapshot(session.cartSnapshot);

      for (const item of snapshot.items) {
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (stockUpdate.count === 0) {
          throw new ApiError(
            409,
            "OUT_OF_STOCK",
            `Insufficient stock for ${item.name}. Payment simulation reverted.`,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          userId: session.userId,
          status: "PAID",
          currency: snapshot.currency,
          totalAmountMinor: snapshot.totalAmountMinor,
          shippingAddressSnapshot:
            session.shippingAddressSnapshot === null
              ? Prisma.JsonNull
              : (session.shippingAddressSnapshot as Prisma.InputJsonValue),
          items: {
            create: snapshot.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              pricePaidMinor: item.unitPriceMinor,
              productNameSnapshot: item.name,
              productSlugSnapshot: item.slug,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      const updatedSession = await tx.paymentSession.update({
        where: { id: session.id },
        data: {
          orderId: order.id,
        },
      });

      return {
        replay: false,
        session: updatedSession,
        order,
      };
    });

    return ok({
      paymentSessionId: completed.session.id,
      status: completed.session.status,
      scenario: "success",
      amountMinor: completed.session.amountMinor,
      amount: inrMinorToDisplay(completed.session.amountMinor),
      currency: completed.session.currency,
      orderId: completed.order?.id ?? null,
      order: completed.order,
      replay: completed.replay,
    });
  } catch (error) {
    return fail(error);
  }
}





