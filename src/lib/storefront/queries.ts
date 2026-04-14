import { prisma } from "@/lib/prisma";
import type { StoreCategory, StoreProduct } from "@/types/store";

const FALLBACK_IMAGES = ["/images/jacket_1.png"];

const fallbackCategories: StoreCategory[] = [
  {
    id: "fallback-outerwear",
    name: "Outerwear",
    slug: "outerwear",
    description: "Engineered layers for all-weather urban wear.",
  },
  {
    id: "fallback-tops",
    name: "Tops",
    slug: "tops",
    description: "Everyday silhouettes with elevated material choices.",
  },
  {
    id: "fallback-bottoms",
    name: "Bottoms",
    slug: "bottoms",
    description: "Functional fits balancing comfort and movement.",
  },
  {
    id: "fallback-accessories",
    name: "Accessories",
    slug: "accessories",
    description: "Minimal add-ons for modern street looks.",
  },
];

const fallbackProducts: StoreProduct[] = [
  {
    id: "fallback-jacket",
    slug: "modular-utility-jacket",
    name: "Modular Utility Jacket",
    description: "Heavy-weight shell with detachable hood and tactical pocket layout.",
    priceMinor: 18000,
    currency: "INR",
    stock: 20,
    images: ["/images/jacket_1.png", "/images/jacket_2.png", "/images/jacket_3.png"],
    isFeatured: true,
    isActive: true,
    category: fallbackCategories[0],
  },
  {
    id: "fallback-hoodie",
    slug: "acid-wash-heavy-hoodie",
    name: "Acid Wash Heavy Hoodie",
    description: "Oversized pullover hoodie in dense cotton fleece with drop shoulders.",
    priceMinor: 12000,
    currency: "INR",
    stock: 30,
    images: ["/images/hoodie_1.png"],
    isFeatured: true,
    isActive: true,
    category: fallbackCategories[1],
  },
  {
    id: "fallback-cargo",
    slug: "tactical-cargo-pants",
    name: "Tactical Cargo Pants",
    description: "Straight-leg cargos with articulated knees and adjustable hem toggles.",
    priceMinor: 15000,
    currency: "INR",
    stock: 18,
    images: ["/images/pants_1.png", "/images/pants_2.png"],
    isFeatured: true,
    isActive: true,
    category: fallbackCategories[2],
  },
  {
    id: "fallback-wide",
    slug: "wide-leg-cargos",
    name: "Wide-Leg Cargos",
    description: "Wide-leg utility bottoms with pleated front and deep cargo pockets.",
    priceMinor: 14000,
    currency: "INR",
    stock: 16,
    images: ["/images/pants_2.png", "/images/pants_1.png"],
    isFeatured: true,
    isActive: true,
    category: fallbackCategories[2],
  },
];

interface ProductQueryOptions {
  featuredOnly?: boolean;
  categorySlug?: string;
  search?: string;
  limit?: number;
}

interface FallbackQueryOptions extends ProductQueryOptions {
  categorySlugs?: string[];
}

function normalizeProduct(product: {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  stock: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}): StoreProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    priceMinor: product.priceMinor,
    currency: product.currency,
    stock: product.stock,
    images: product.images.length > 0 ? product.images : FALLBACK_IMAGES,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    category: product.category,
  };
}

function normalizeSlugList(values: string[]) {
  return values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)
    .slice(0, 6);
}

function resolveAgeCategoryHints(age: number | null | undefined) {
  if (!age || age < 13) {
    return ["tops", "accessories"];
  }

  if (age <= 21) {
    return ["tops", "accessories", "bottoms"];
  }

  if (age <= 30) {
    return ["tops", "outerwear", "bottoms"];
  }

  if (age <= 45) {
    return ["outerwear", "bottoms", "accessories"];
  }

  return ["outerwear", "accessories", "tops"];
}

function fallbackProductsFiltered(options?: FallbackQueryOptions) {
  const filtered = fallbackProducts.filter((product) => {
    if (options?.featuredOnly && !product.isFeatured) return false;

    if (options?.categorySlug && product.category.slug !== options.categorySlug) return false;

    if (options?.categorySlugs?.length && !options.categorySlugs.includes(product.category.slug)) return false;

    if (options?.search) {
      const query = options.search.toLowerCase();
      if (!product.name.toLowerCase().includes(query) && !product.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    return true;
  });

  return filtered.slice(0, options?.limit ?? 100);
}

export async function getCategories(): Promise<StoreCategory[]> {
  try {
    return await prisma.category.findMany({ orderBy: { name: "asc" } });
  } catch {
    return fallbackCategories;
  }
}

export async function getProducts(options?: ProductQueryOptions): Promise<StoreProduct[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: options?.featuredOnly ? true : undefined,
        category: options?.categorySlug
          ? {
              slug: options.categorySlug,
            }
          : undefined,
        OR: options?.search
          ? [
              {
                name: {
                  contains: options.search,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: options.search,
                  mode: "insensitive",
                },
              },
            ]
          : undefined,
      },
      include: {
        category: true,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: options?.limit ?? 100,
    });

    return products.map(normalizeProduct);
  } catch {
    return fallbackProductsFiltered(options);
  }
}

export async function getPersonalizedProducts(params: {
  userId?: string | null;
  limit?: number;
}): Promise<StoreProduct[]> {
  const limit = Math.min(Math.max(params.limit ?? 4, 1), 12);

  if (!params.userId) {
    return getProducts({ featuredOnly: true, limit });
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: params.userId },
      select: {
        age: true,
        preferredCategories: true,
      },
    });

    const preferredCategories = normalizeSlugList(profile?.preferredCategories ?? []);
    const ageHints = resolveAgeCategoryHints(profile?.age);
    const targetCategories = preferredCategories.length > 0 ? preferredCategories : ageHints;

    const primary = await prisma.product.findMany({
      where: {
        isActive: true,
        category:
          targetCategories.length > 0
            ? {
                slug: {
                  in: targetCategories,
                },
              }
            : undefined,
      },
      include: {
        category: true,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    if (primary.length >= limit) {
      return primary.map(normalizeProduct);
    }

    const secondary = await prisma.product.findMany({
      where: {
        isActive: true,
        id: {
          notIn: primary.map((item) => item.id),
        },
      },
      include: {
        category: true,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit - primary.length,
    });

    const merged = [...primary, ...secondary].map(normalizeProduct);

    if (merged.length > 0) {
      return merged;
    }
  } catch {
    return fallbackProductsFiltered({
      featuredOnly: true,
      categorySlugs: ["outerwear", "tops", "bottoms", "accessories"],
      limit,
    });
  }

  return getProducts({ featuredOnly: true, limit });
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<StoreProduct | null> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
      },
    });

    if (!product) return null;

    return normalizeProduct(product);
  } catch {
    return fallbackProducts.find((product) => product.id === idOrSlug || product.slug === idOrSlug) || null;
  }
}
