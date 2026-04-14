"use client";

import { useMemo, useState } from "react";

import { useAuth, useClerk } from "@clerk/nextjs";
import { ChevronDown, Minus, Plus } from "lucide-react";

import { useCart } from "@/components/cart/CartContext";
import { formatMoneyFromMinor } from "@/lib/storefront/currency";
import type { StoreProduct } from "@/types/store";

const sizes = ["S", "M", "L", "XL", "XXL"];

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

export function ProductDetailClient({ product }: { product: StoreProduct }) {
  const { addItem } = useCart();
  const { isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("details");
  const [isAdded, setIsAdded] = useState(false);
  const [checkingRequirements, setCheckingRequirements] = useState(false);

  const maxQuantity = Math.max(product.stock, 1);

  const totalPrice = useMemo(
    () => formatMoneyFromMinor(product.priceMinor * quantity, product.currency),
    [product.priceMinor, product.currency, quantity],
  );

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
    <div className="lg:w-[40%]">
      <div className="sticky top-32">
        <div className="mb-8 border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">{product.name}</h1>
          <p className="text-2xl font-medium tracking-tight mb-2">
            {formatMoneyFromMinor(product.priceMinor, product.currency)}
          </p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <p className="text-muted-foreground">{product.description}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold uppercase tracking-widest text-sm">Size</span>
            <button
              type="button"
              className="text-xs uppercase tracking-widest text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Size Guide
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`py-3 border text-sm font-bold transition-all ${
                  selectedSize === size
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:border-foreground/50"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {!selectedSize ? (
            <p className="text-muted-foreground text-xs mt-2 uppercase tracking-widest">
              Select a size before adding to cart
            </p>
          ) : null}
        </div>

        <div className="flex flex-col xl:flex-row gap-4 mb-12">
          <div className="flex items-center border border-border px-4 py-4 xl:w-1/3 justify-between">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="hover:text-muted-foreground transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-medium text-sm w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
              className="hover:text-muted-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (product.stock <= 0 || !selectedSize || checkingRequirements) {
                return;
              }

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
                setIsAdded(true);
                window.setTimeout(() => setIsAdded(false), 1800);
              } finally {
                setCheckingRequirements(false);
              }
            }}
            disabled={product.stock <= 0 || !selectedSize || checkingRequirements}
            className="flex-1 bg-foreground text-background font-black uppercase tracking-widest text-sm py-4 xl:py-0 hover:bg-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdded
              ? "Added to Cart"
              : checkingRequirements
                ? "Checking profile..."
                : !isSignedIn
                  ? "Sign in to add"
                  : `Add to Cart - ${totalPrice}`}
          </button>
        </div>

        <div className="border-t border-border">
          <div className="border-b border-border">
            <button
              type="button"
              onClick={() => setActiveAccordion(activeAccordion === "details" ? null : "details")}
              className="w-full py-6 flex justify-between items-center group"
            >
              <span className="font-bold uppercase tracking-widest text-sm group-hover:text-muted-foreground transition-colors">
                The Details
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${
                  activeAccordion === "details" ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                activeAccordion === "details" ? "max-h-[500px] opacity-100 pb-6" : "max-h-0 opacity-0"
              }`}
            >
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Premium blend fabric and reinforced stitching.</li>
                <li>Tailored for comfort and all-day movement.</li>
                <li>Cloud-optimized imagery and simulation-first checkout flow.</li>
                <li>Designed for BlushCo academic cloud architecture project.</li>
              </ul>
            </div>
          </div>

          <div className="border-b border-border">
            <button
              type="button"
              onClick={() => setActiveAccordion(activeAccordion === "shipping" ? null : "shipping")}
              className="w-full py-6 flex justify-between items-center group"
            >
              <span className="font-bold uppercase tracking-widest text-sm group-hover:text-muted-foreground transition-colors">
                Shipping & Returns
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${
                  activeAccordion === "shipping" ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                activeAccordion === "shipping" ? "max-h-[500px] opacity-100 pb-6" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-muted-foreground">
                Academic demo mode: checkout is simulated and no real shipping is triggered. You can still verify order lifecycle states and UX behavior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
