"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { useCart } from "@/components/cart/CartContext";
import { CartDrawer } from "@/components/layout/CartDrawer";

export function Navbar() {
  const { itemCount } = useCart();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[40] transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border/40 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <button
            aria-label="Open navigation menu"
            className="md:hidden text-foreground hover:opacity-70 transition-opacity"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
            <Link
              href="/shop"
              className="hover:text-muted-foreground transition-colors selection:bg-foreground selection:text-background relative group"
            >
              NEW ARRIVALS
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all group-hover:w-full" />
            </Link>
            <Link href="/shop" className="hover:text-muted-foreground transition-colors relative group">
              SHOP ALL
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all group-hover:w-full" />
            </Link>
            <Link href="/shop" className="hover:text-muted-foreground transition-colors relative group">
              COLLECTIONS
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all group-hover:w-full" />
            </Link>
          </nav>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black tracking-tighter uppercase"
          >
            BlushCo.
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/shop" className="text-foreground hover:text-muted-foreground transition-colors" aria-label="Search products">
              <Search className="w-5 h-5" />
            </Link>
            <button
              className="text-foreground hover:text-muted-foreground transition-colors relative flex items-center gap-2 group"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
            >
              <span className="hidden md:inline-block text-sm font-medium group-hover:underline underline-offset-4">
                CART
              </span>
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[10px] font-bold min-w-4 h-4 rounded-full px-1 flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
            </button>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-xs font-bold tracking-widest uppercase border border-border px-3 py-2 hover:border-foreground transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <Link
                href="/account"
                className="text-xs font-bold tracking-widest uppercase border border-border px-3 py-2 hover:border-foreground transition-colors"
              >
                Account
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-0 bg-background z-50 flex flex-col p-6 md:hidden"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-2xl font-black tracking-tighter uppercase">BlushCo.</span>
                <button aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-8 h-8" />
                </button>
              </div>
              <nav className="flex flex-col gap-6 text-3xl font-black uppercase tracking-tight">
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  New Arrivals
                </Link>
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  Shop All
                </Link>
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  Collections
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}


