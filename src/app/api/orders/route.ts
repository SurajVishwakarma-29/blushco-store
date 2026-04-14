import { fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireSignedIn } from "@/lib/backend/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    const url = new URL(request.url);
    const includeAll = auth.role === "ADMIN" && url.searchParams.get("scope") === "all";

    const orders = await prisma.order.findMany({
      where: includeAll
        ? undefined
        : {
            userId,
          },
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
      orderBy: { createdAt: "desc" },
    });

    return ok(orders);
  } catch (error) {
    return fail(error);
  }
}

