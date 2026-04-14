import { ApiError, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireSignedIn } from "@/lib/backend/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

function normalizeOptionalAddress(body: {
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
  return {
    fullName: body.fullName?.trim(),
    phone: body.phone?.trim() || null,
    line1: body.line1?.trim(),
    line2: body.line2?.trim() || null,
    city: body.city?.trim(),
    state: body.state?.trim(),
    postalCode: body.postalCode?.trim(),
    country: body.country?.trim(),
    isDefault: typeof body.isDefault === "boolean" ? body.isDefault : undefined,
  };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    const { id } = await params;
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

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found.");
    }

    const normalized = normalizeOptionalAddress(body);

    const updated = await prisma.$transaction(async (tx) => {
      if (normalized.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          fullName: normalized.fullName ?? existing.fullName,
          phone: body.phone === undefined ? existing.phone : normalized.phone,
          line1: normalized.line1 ?? existing.line1,
          line2: body.line2 === undefined ? existing.line2 : normalized.line2,
          city: normalized.city ?? existing.city,
          state: normalized.state ?? existing.state,
          postalCode: normalized.postalCode ?? existing.postalCode,
          country: normalized.country ?? existing.country,
          isDefault: normalized.isDefault ?? existing.isDefault,
        },
      });
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    const { id } = await params;

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (existing.isDefault) {
        const fallback = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (fallback) {
          await tx.address.update({
            where: { id: fallback.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return ok({ deleted: true, id });
  } catch (error) {
    return fail(error);
  }
}
