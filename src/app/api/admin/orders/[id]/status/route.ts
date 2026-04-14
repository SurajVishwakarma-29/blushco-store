import { ApiError, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireAdmin } from "@/lib/backend/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

const allowedStatuses = new Set(["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"]);

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { id } = await params;
    const body = (await request.json()) as { status?: string };

    const status = body.status?.toUpperCase();

    if (!status || !allowedStatuses.has(status)) {
      throw new ApiError(400, "INVALID_STATUS", "status must be one of PENDING, PAID, FULFILLED, CANCELLED, REFUNDED.");
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status as "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED",
      },
      include: {
        items: true,
      },
    });

    return ok(order);
  } catch (error) {
    return fail(error);
  }
}

