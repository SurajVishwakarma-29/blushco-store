"use client";

import { useAuth } from "@clerk/nextjs";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { CartItem, StoreProduct } from "@/types/store";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalMinor: number;
  addItem: (product: StoreProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(next: number, max: number) {
  if (Number.isNaN(next)) return 1;
  return Math.max(1, Math.min(next, Math.max(max, 1)));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const storageKey = useMemo(
    () => `blushco-cart-v1-${isSignedIn && userId ? userId : "guest"}`,
    [isSignedIn, userId],
  );

  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setItems([]);
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setItems(parsed);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items, storageKey]);

  const addItem = useCallback((product: StoreProduct, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);

      if (!existing) {
        const nextQuantity = clampQuantity(quantity, product.stock);

        return [
          ...current,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images[0] || "/images/jacket_1.png",
            unitPriceMinor: product.priceMinor,
            currency: product.currency,
            quantity: nextQuantity,
            stock: product.stock,
          },
        ];
      }

      return current.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              quantity: clampQuantity(item.quantity + quantity, item.stock),
              stock: product.stock,
              unitPriceMinor: product.priceMinor,
              image: product.images[0] || item.image,
            }
          : item,
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: clampQuantity(quantity, item.stock),
            }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalMinor = items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0);

    return {
      items,
      itemCount,
      subtotalMinor,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [items, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
