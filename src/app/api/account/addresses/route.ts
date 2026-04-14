import { ApiError, created, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireSignedIn } from "@/lib/backend/auth";
import { ensureUserExists } from "@/lib/backend/users";
import { prisma } from "@/lib/prisma";

function normalizeAddress(body: {
  fullName?: string;
  phone?: string | null;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}) {
  const normalized = {
    fullName: body.fullName?.trim() || "",
    phone: body.phone?.trim() || null,
    line1: body.line1?.trim() || "",
    line2: body.line2?.trim() || null,
    city: body.city?.trim() || "",
    state: body.state?.trim() || "",
    postalCode: body.postalCode?.trim() || "",
    country: body.country?.trim() || "IN",
    isDefault: Boolean(body.isDefault),
  };

  const required = ["fullName", "line1", "city", "state", "postalCode"] as const;

  for (const key of required) {
    if (!normalized[key]) {
      throw new ApiError(400, "INVALID_ADDRESS", `${key} is required.`);
    }
  }

  return normalized;
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    await ensureUserExists(prisma, { userId, email: auth.email });

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return ok(addresses);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    const body = (await request.json()) as {
      fullName?: string;
      phone?: string | null;
      line1?: string;
      line2?: string | null;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      isDefault?: boolean;
    };

    await ensureUserExists(prisma, { userId, email: auth.email });

    const normalized = normalizeAddress(body);

    const count = await prisma.address.count({ where: { userId } });

    const address = await prisma.$transaction(async (tx) => {
      const shouldDefault = normalized.isDefault || count === 0;

      if (shouldDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          fullName: normalized.fullName,
          phone: normalized.phone,
          line1: normalized.line1,
          line2: normalized.line2,
          city: normalized.city,
          state: normalized.state,
          postalCode: normalized.postalCode,
          country: normalized.country,
          isDefault: shouldDefault,
        },
      });
    });

    return created(address);
  } catch (error) {
    return fail(error);
  }
}
