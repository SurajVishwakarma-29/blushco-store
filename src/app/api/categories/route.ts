import { ApiError, created, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireAdmin } from "@/lib/backend/auth";
import { ensureSlug } from "@/lib/backend/slug";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return ok(categories);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      description?: string;
    };

    const name = body.name?.trim();

    if (!name) {
      throw new ApiError(400, "INVALID_NAME", "Category name is required.");
    }

    const slug = ensureSlug(body.slug, name);
    const description = body.description?.trim() || null;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
      },
    });

    return created(category);
  } catch (error) {
    return fail(error);
  }
}

