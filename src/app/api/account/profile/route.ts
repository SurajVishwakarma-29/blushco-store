import { ApiError, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireSignedIn } from "@/lib/backend/auth";
import { ensureUserExists } from "@/lib/backend/users";
import { prisma } from "@/lib/prisma";

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0)
    .slice(0, 12);
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    await ensureUserExists(prisma, { userId, email: auth.email });

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    return ok(profile ?? { userId, age: null, phone: null, preferredCategories: [], clothingSizes: [] });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const userId = requireSignedIn(auth);

    const body = (await request.json()) as {
      age?: number | null;
      phone?: string | null;
      preferredCategories?: string[];
      clothingSizes?: string[];
    };

    await ensureUserExists(prisma, { userId, email: auth.email });

    const age = body.age === null || body.age === undefined ? null : Number(body.age);
    if (age !== null && (!Number.isInteger(age) || age < 13 || age > 100)) {
      throw new ApiError(400, "INVALID_AGE", "Age must be an integer between 13 and 100.");
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        age,
        phone: body.phone?.trim() || null,
        preferredCategories: normalizeStringArray(body.preferredCategories),
        clothingSizes: normalizeStringArray(body.clothingSizes),
      },
      update: {
        age,
        phone: body.phone?.trim() || null,
        preferredCategories: normalizeStringArray(body.preferredCategories),
        clothingSizes: normalizeStringArray(body.clothingSizes),
      },
    });

    return ok(profile);
  } catch (error) {
    return fail(error);
  }
}
