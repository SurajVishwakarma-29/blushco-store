"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/cart/CartContext";
import { formatMoneyFromMinor } from "@/lib/storefront/currency";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

type SimulationScenario = "success" | "failed" | "pending" | "cancelled";

interface AddressRecord {
  id: string;
  fullName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

const FREE_SHIPPING_THRESHOLD_MINOR = 50000;

export function CartDrawer({ isOpen, onClose }: CartProps) {
  const { items, subtotalMinor, updateQuantity, removeItem, clearCart } = useCart();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { redirectToSignIn } = useClerk();

  const [scenario, setScenario] = useState<SimulationScenario>("success");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [profileReady, setProfileReady] = useState(false);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [requirementsLoading, setRequirementsLoading] = useState(false);

  const progress = useMemo(
    () => Math.min((subtotalMinor / FREE_SHIPPING_THRESHOLD_MINOR) * 100, 100),
    [subtotalMinor],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    async function loadRequirements() {
      if (!isOpen || !isSignedIn) {
        setProfileReady(false);
        setAddresses([]);
        setSelectedAddressId("");
        return;
      }

      setRequirementsLoading(true);

      try {
        const [profileRes, addressRes] = await Promise.all([
          fetch("/api/account/profile"),
          fetch("/api/account/addresses"),
        ]);

        const profilePayload = (await profileRes.json()) as {
          success: boolean;
          data?: { age?: number | null };
        };

        const addressesPayload = (await addressRes.json()) as {
          success: boolean;
          data?: AddressRecord[];
        };

        const resolvedAddresses = addressesPayload.success && addressesPayload.data ? addressesPayload.data : [];
        setAddresses(resolvedAddresses);

        const defaultAddress = resolvedAddresses.find((entry) => entry.isDefault) || resolvedAddresses[0];
        setSelectedAddressId(defaultAddress?.id || "");

        setProfileReady(Boolean(profilePayload.success && profilePayload.data?.age));
      } finally {
        setRequirementsLoading(false);
      }
    }

    void loadRequirements();
  }, [isOpen, isSignedIn]);

  async function handleCheckout() {
    if (items.length === 0 || isCheckingOut) {
      return;
    }

    if (!isSignedIn || !userId) {
      await redirectToSignIn({ redirectUrl: window.location.href });
      return;
    }

    if (!profileReady || !selectedAddressId) {
      setMessage("Please complete account details and select a shipping address.");
      return;
    }

    setIsCheckingOut(true);
    setMessage(null);
    setOrderId(null);

    const userEmail = user?.primaryEmailAddress?.emailAddress || null;

    try {
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-email": userEmail || "",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          addressId: selectedAddressId,
          idempotencyKey: `${userId}-${Date.now()}`,
        }),
      });

      const checkoutPayload = (await checkoutResponse.json()) as {
        success: boolean;
        data?: { paymentSessionId?: string };
        error?: { message?: string };
      };

      if (!checkoutResponse.ok || !checkoutPayload.success || !checkoutPayload.data?.paymentSessionId) {
        throw new Error(checkoutPayload.error?.message || "Unable to initialize checkout.");
      }

      const simulateResponse = await fetch("/api/payments/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-email": userEmail || "",
        },
        body: JSON.stringify({
          paymentSessionId: checkoutPayload.data.paymentSessionId,
          scenario,
        }),
      });

      const simulatePayload = (await simulateResponse.json()) as {
        success: boolean;
        data?: { orderId?: string; status?: string };
        error?: { message?: string };
      };

      if (!simulateResponse.ok || !simulatePayload.success) {
        throw new Error(simulatePayload.error?.message || "Unable to simulate payment.");
      }

      if (scenario === "success" && simulatePayload.data?.orderId) {
        clearCart();
        setOrderId(simulatePayload.data.orderId);
        setMessage("Payment simulated successfully. Order created.");
      } else if (scenario === "pending") {
        setMessage("Payment is pending. You can retry simulation later.");
      } else if (scenario === "failed") {
        setMessage("Payment simulated as failed. No order was created.");
      } else {
        setMessage("Payment simulation cancelled. No order was created.");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Checkout failed", error);
      }

      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Your Cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Your Cart
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Close cart">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 bg-muted/50 border-b border-border space-y-4">
              <p className="text-sm font-bold tracking-widest uppercase text-center">
                {subtotalMinor >= FREE_SHIPPING_THRESHOLD_MINOR
                  ? "You unlocked free shipping"
                  : `Add ${formatMoneyFromMinor(FREE_SHIPPING_THRESHOLD_MINOR - subtotalMinor)} for free shipping`}
              </p>
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-foreground"
                />
              </div>
              <label className="flex items-center justify-between gap-3 text-xs uppercase tracking-widest">
                <span>Simulation Mode</span>
                <select
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value as SimulationScenario)}
                  className="bg-background border border-border px-3 py-2 text-xs uppercase tracking-wider"
                >
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              {isSignedIn ? (
                <label className="flex items-center justify-between gap-3 text-xs uppercase tracking-widest">
                  <span>Shipping Address</span>
                  <select
                    value={selectedAddressId}
                    onChange={(event) => setSelectedAddressId(event.target.value)}
                    className="bg-background border border-border px-3 py-2 text-xs uppercase tracking-wider max-w-[58%]"
                  >
                    <option value="">Select</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.fullName} - {address.city}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground uppercase tracking-widest text-center py-12">
                  Your cart is empty
                </p>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="relative w-24 h-32 bg-muted flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover grayscale" />
                    </div>
                    <div className="flex flex-col flex-1 justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-3">
                          <h3 className="font-bold uppercase tracking-tight text-sm leading-tight">{item.name}</h3>
                          <p className="font-medium text-sm whitespace-nowrap">
                            {formatMoneyFromMinor(item.unitPriceMinor * item.quantity, item.currency)}
                          </p>
                        </div>
                        <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
                          Unit {formatMoneyFromMinor(item.unitPriceMinor, item.currency)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-2 hover:bg-muted transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-2 hover:bg-muted transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-xs uppercase tracking-widest text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-border bg-background space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase tracking-widest">Subtotal</span>
                <span className="text-xl font-medium tracking-tight">{formatMoneyFromMinor(subtotalMinor)}</span>
              </div>

              {!isSignedIn ? (
                <p className="text-xs uppercase tracking-widest text-center text-muted-foreground">
                  Sign in to continue to checkout
                </p>
              ) : requirementsLoading ? (
                <p className="text-xs uppercase tracking-widest text-center text-muted-foreground">
                  Loading your account details...
                </p>
              ) : !profileReady || addresses.length === 0 ? (
                <p className="text-xs uppercase tracking-widest text-center text-muted-foreground">
                  Complete age + shipping details in <Link href="/account" className="underline">My Account</Link> before checkout.
                </p>
              ) : message ? (
                <p className="text-xs uppercase tracking-widest text-center text-muted-foreground">{message}</p>
              ) : (
                <p className="text-xs text-muted-foreground uppercase tracking-widest text-center">
                  Academic simulation: no real payment will be processed
                </p>
              )}

              {orderId ? (
                <p className="text-xs uppercase tracking-widest text-center break-all">
                  Order ID: <span className="font-bold">{orderId}</span>
                </p>
              ) : null}

              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || isCheckingOut || requirementsLoading || !isSignedIn}
                className="w-full bg-foreground text-background font-black tracking-widest py-4 uppercase hover:bg-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isSignedIn ? "Sign In to Checkout" : isCheckingOut ? "Processing..." : "Simulate Checkout"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
