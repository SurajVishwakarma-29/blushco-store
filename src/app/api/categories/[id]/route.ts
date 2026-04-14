import { ApiError, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireAdmin } from "@/lib/backend/auth";
import { ensureSlug } from "@/lib/backend/slug";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      description?: string | null;
    };

    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
      throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found.");
    }

    const name = body.name?.trim() || existing.name;
    const slug = ensureSlug(body.slug, name);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description:
          body.description === undefined ? existing.description : body.description?.trim() || null,
      },
    });

    return ok(category);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { id } = await params;

    const productCount = await prisma.product.count({ where: { categoryId: id } });

    if (productCount > 0) {
      throw new ApiError(
        409,
        "CATEGORY_NOT_EMPTY",
        "Cannot delete category with products. Move or delete products first.",
      );
    }

    await prisma.category.delete({ where: { id } });

    return ok({ deleted: true, id });
  } catch (error) {
    return fail(error);
  }
}

