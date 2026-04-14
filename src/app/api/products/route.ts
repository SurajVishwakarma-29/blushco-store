import { ApiError, created, fail, ok } from "@/lib/backend/api";
import { getAuthContext, requireAdmin } from "@/lib/backend/auth";
import { ensureSlug } from "@/lib/backend/slug";
import { prisma } from "@/lib/prisma";

function parsePositiveInt(value: string | null, fallback: number) {
  if (value === null) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return parsed;
}

function createPriceMinor(input: { priceMinor?: unknown; price?: unknown }) {
  if (input.priceMinor !== undefined) {
    const parsed = Number(input.priceMinor);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new ApiError(400, "INVALID_PRICE", "priceMinor must be a non-negative integer.");
    }
    return parsed;
  }

  if (input.price !== undefined) {
    const parsed = Number(input.price);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new ApiError(400, "INVALID_PRICE", "price must be a non-negative number.");
    }
    return Math.round(parsed * 100);
  }

  throw new ApiError(400, "INVALID_PRICE", "Either priceMinor or price is required.");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const featured = url.searchParams.get("featured") === "true";
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const categoryId = url.searchParams.get("categoryId");
    const search = url.searchParams.get("search")?.trim();
    const limit = Math.min(parsePositiveInt(url.searchParams.get("limit"), 24), 100);
    const offset = parsePositiveInt(url.searchParams.get("offset"), 0);

    const products = await prisma.product.findMany({
      where: {
        isFeatured: featured || undefined,
        isActive: includeInactive ? undefined : true,
        categoryId: categoryId || undefined,
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return ok(products);
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
      priceMinor?: number;
      price?: number;
      stock?: number;
      categoryId?: string;
      images?: string[];
      isFeatured?: boolean;
      isActive?: boolean;
      currency?: string;
    };

    const name = body.name?.trim();
    const description = body.description?.trim();

    if (!name) {
      throw new ApiError(400, "INVALID_NAME", "Product name is required.");
    }

    if (!description) {
      throw new ApiError(400, "INVALID_DESCRIPTION", "Product description is required.");
    }

    if (!body.categoryId?.trim()) {
      throw new ApiError(400, "INVALID_CATEGORY", "categoryId is required.");
    }

    const categoryExists = await prisma.category.count({ where: { id: body.categoryId } });

    if (!categoryExists) {
      throw new ApiError(400, "INVALID_CATEGORY", "Provided categoryId does not exist.");
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: ensureSlug(body.slug, name),
        description,
        priceMinor: createPriceMinor({ priceMinor: body.priceMinor, price: body.price }),
        stock: Number.isInteger(body.stock) && body.stock! >= 0 ? body.stock! : 0,
        categoryId: body.categoryId,
        images:
          Array.isArray(body.images) && body.images.length > 0
            ? body.images.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
            : [],
        isFeatured: Boolean(body.isFeatured),
        isActive: body.isActive ?? true,
        currency: body.currency?.trim() || "INR",
      },
    });

    return created(product);
  } catch (error) {
    return fail(error);
  }
}

