import { randomUUID } from "node:crypto";

import { ApiError } from "@/lib/backend/api";

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

export interface NormalizedCheckoutItem {
  productId: string;
  quantity: number;
}

export interface CartSnapshotItem {
  productId: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  name: string;
  slug: string;
  currency: string;
}

export interface CartSnapshot {
  items: CartSnapshotItem[];
  totalAmountMinor: number;
  currency: string;
}

export function normalizeCheckoutItems(input: unknown): NormalizedCheckoutItem[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ApiError(400, "INVALID_CART", "At least one cart item is required.");
  }

  if (input.length > 50) {
    throw new ApiError(400, "INVALID_CART", "Cart item limit exceeded.");
  }

  const aggregated = new Map<string, number>();

  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      throw new ApiError(400, "INVALID_CART", "Each cart item must be an object.");
    }

    const record = raw as Partial<CheckoutItemInput>;
    const productId = typeof record.productId === "string" ? record.productId.trim() : "";
    const quantity = Number(record.quantity);

    if (!productId) {
      throw new ApiError(400, "INVALID_CART", "Each cart item must include a productId.");
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 25) {
      throw new ApiError(400, "INVALID_CART", "Quantity must be an integer between 1 and 25.");
    }

    aggregated.set(productId, (aggregated.get(productId) ?? 0) + quantity);
  }

  return Array.from(aggregated.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export function inrMinorToDisplay(amountMinor: number) {
  return Number((amountMinor / 100).toFixed(2));
}

export function assertScenario(value: unknown): "success" | "failed" | "pending" | "cancelled" {
  if (typeof value !== "string") {
    throw new ApiError(400, "INVALID_SCENARIO", "scenario must be a string.");
  }

  const normalized = value.toLowerCase();

  if (
    normalized !== "success" &&
    normalized !== "failed" &&
    normalized !== "pending" &&
    normalized !== "cancelled"
  ) {
    throw new ApiError(400, "INVALID_SCENARIO", "scenario must be one of success, failed, pending, cancelled.");
  }

  return normalized;
}

export function createExternalReference(prefix = "SIM") {
  return `${prefix}-${Date.now()}-${randomUUID()}`;
}

export function toCartSnapshot(value: unknown): CartSnapshot {
  if (!value || typeof value !== "object") {
    throw new ApiError(500, "INVALID_PAYMENT_SNAPSHOT", "Payment cart snapshot is missing or malformed.");
  }

  const record = value as Partial<CartSnapshot>;

  if (!Array.isArray(record.items) || typeof record.totalAmountMinor !== "number") {
    throw new ApiError(500, "INVALID_PAYMENT_SNAPSHOT", "Payment cart snapshot is incomplete.");
  }

  return {
    items: record.items,
    totalAmountMinor: record.totalAmountMinor,
    currency: typeof record.currency === "string" ? record.currency : "INR",
  };
}
