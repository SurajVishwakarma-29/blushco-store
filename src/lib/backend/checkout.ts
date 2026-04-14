import type { PrismaClient } from "@prisma/client";

import { ApiError } from "@/lib/backend/api";
import type { CartSnapshot, NormalizedCheckoutItem } from "@/lib/backend/commerce";

export async function buildSnapshotFromCart(
  prisma: PrismaClient,
  items: NormalizedCheckoutItem[],
): Promise<CartSnapshot> {
  const productIds = items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      priceMinor: true,
      currency: true,
      stock: true,
    },
  });

  if (products.length !== productIds.length) {
    const found = new Set(products.map((product) => product.id));
    const missing = productIds.filter((productId) => !found.has(productId));

    throw new ApiError(400, "PRODUCTS_NOT_FOUND", "Some products were not found or are inactive.", {
      missing,
    });
  }

  const byId = new Map(products.map((product) => [product.id, product]));

  const snapshotItems = items.map((item) => {
    const product = byId.get(item.productId);

    if (!product) {
      throw new ApiError(400, "PRODUCT_NOT_FOUND", `Product ${item.productId} not found.`);
    }

    if (item.quantity > product.stock) {
      throw new ApiError(409, "OUT_OF_STOCK", `Not enough stock for ${product.name}.`, {
        productId: product.id,
        requested: item.quantity,
        available: product.stock,
      });
    }

    return {
      productId: product.id,
      quantity: item.quantity,
      unitPriceMinor: product.priceMinor,
      lineTotalMinor: product.priceMinor * item.quantity,
      name: product.name,
      slug: product.slug,
      currency: product.currency,
    };
  });

  const currencies = new Set(snapshotItems.map((item) => item.currency));

  if (currencies.size !== 1) {
    throw new ApiError(400, "CURRENCY_MISMATCH", "All cart items must use the same currency.");
  }

  return {
    items: snapshotItems,
    totalAmountMinor: snapshotItems.reduce((sum, item) => sum + item.lineTotalMinor, 0),
    currency: snapshotItems[0]?.currency ?? "INR",
  };
}
