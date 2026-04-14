import { ApiError, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireAdmin } from "@/lib/backend/auth";
import { ensureSlug } from "@/lib/backend/slug";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

function updatePriceMinor(
  input: { priceMinor?: unknown; price?: unknown },
  fallback: number,
) {
  if (input.priceMinor === undefined && input.price === undefined) {
    return fallback;
  }

  if (input.priceMinor !== undefined) {
    const parsed = Number(input.priceMinor);

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new ApiError(400, "INVALID_PRICE", "priceMinor must be a non-negative integer.");
    }

    return parsed;
  }

  const parsed = Number(input.price);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError(400, "INVALID_PRICE", "price must be a non-negative number.");
  }

  return Math.round(parsed * 100);
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    return ok(product);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      description?: string;
      priceMinor?: number;
      price?: number;
      stock?: number;
      categoryId?: string;
      images?: string[];
      isFeatured?: boolean;
      isActive?: boolean;
      currency?: string;
    };

    if (body.categoryId) {
      const categoryExists = await prisma.category.count({ where: { id: body.categoryId } });
      if (!categoryExists) {
        throw new ApiError(400, "INVALID_CATEGORY", "Provided categoryId does not exist.");
      }
    }

    const nextName = body.name?.trim() || existing.name;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: nextName,
        slug: ensureSlug(body.slug, nextName),
        description: body.description?.trim() ?? existing.description,
        priceMinor: updatePriceMinor({ priceMinor: body.priceMinor, price: body.price }, existing.priceMinor),
        stock: Number.isInteger(body.stock) && body.stock! >= 0 ? body.stock! : existing.stock,
        categoryId: body.categoryId ?? existing.categoryId,
        images: Array.isArray(body.images)
          ? body.images.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
          : existing.images,
        isFeatured: typeof body.isFeatured === "boolean" ? body.isFeatured : existing.isFeatured,
        isActive: typeof body.isActive === "boolean" ? body.isActive : existing.isActive,
        currency: body.currency?.trim() || existing.currency,
      },
    });

    return ok(product);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { id } = await params;

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

    if (orderItemCount > 0) {
      const archived = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      return ok({ deleted: false, archived: true, product: archived });
    }

    await prisma.product.delete({ where: { id } });

    return ok({ deleted: true, archived: false, id });
  } catch (error) {
    return fail(error);
  }
}

