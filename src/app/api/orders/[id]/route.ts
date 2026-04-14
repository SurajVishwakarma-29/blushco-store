import { ApiError, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireSignedIn } from "@/lib/backend/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        paymentSession: {
          select: {
            id: true,
            status: true,
            externalReference: true,
            provider: true,
            scenario: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
    }

    if (auth.role !== "ADMIN" && order.userId !== userId) {
      throw new ApiError(403, "FORBIDDEN", "You cannot access this order.");
    }

    return ok(order);
  } catch (error) {
    return fail(error);
  }
}

