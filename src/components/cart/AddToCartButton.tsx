"use client";

import { useMemo, useState } from "react";

import { useAuth, useClerk } from "@clerk/nextjs";
import { Check } from "lucide-react";

import { useCart } from "@/components/cart/CartContext";
import type { StoreProduct } from "@/types/store";

interface AddToCartButtonProps {
  product: StoreProduct;
  quantity?: number;
  className?: string;
  label?: string;
}

interface AccountProfileResponse {
  success: boolean;
  data?: {
    age?: number | null;
  };
}

interface AccountAddressResponse {
  success: boolean;
  data?: Array<{ id: string }>;
}

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  label = "Add to Cart",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { isSignedIn, isLoaded } = useAuth();
  const { redirectToSignIn } = useClerk();

  const [added, setAdded] = useState(false);
  const [checkingRequirements, setCheckingRequirements] = useState(false);

  const isOutOfStock = useMemo(() => product.stock <= 0, [product.stock]);

  async function accountIsReady() {
    const [profileResponse, addressesResponse] = await Promise.all([
      fetch("/api/account/profile"),
      fetch("/api/account/addresses"),
    ]);

    const profilePayload = (await profileResponse.json()) as AccountProfileResponse;
    const addressesPayload = (await addressesResponse.json()) as AccountAddressResponse;

    return Boolean(
      profilePayload.success &&
        profilePayload.data?.age &&
        addressesPayload.success &&
        (addressesPayload.data?.length ?? 0) > 0,
    );
  }

  return (
    <button
      type="button"
      disabled={!isLoaded || isOutOfStock || checkingRequirements}
      onClick={async () => {
        if (!isLoaded || isOutOfStock || checkingRequirements) return;

        if (!isSignedIn) {
          await redirectToSignIn({ redirectUrl: window.location.href });
          return;
        }

        setCheckingRequirements(true);

        try {
          const ready = await accountIsReady();

          if (!ready) {
            window.location.assign("/account");
            return;
          }

          addItem(product, quantity);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1200);
        } finally {
          setCheckingRequirements(false);
        }
      }}
      className={className}
    >
      {isOutOfStock ? (
        "Out of Stock"
      ) : checkingRequirements ? (
        "Checking profile..."
      ) : added ? (
        <span className="inline-flex items-center gap-2">
          <Check className="w-4 h-4" /> Added
        </span>
      ) : !isSignedIn ? (
        "Sign in to add"
      ) : (
        label
      )}
    </button>
  );
}
