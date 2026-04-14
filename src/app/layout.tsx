import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import { CartProvider } from "@/components/cart/CartContext";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "BlushCo | Modern Streetwear",
  description:
    "A never-seen-before e-commerce experience for modern fashion. Discover your style with BlushCo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/account">
      <html lang="en" className="dark scroll-smooth">
        <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
          <CartProvider>
            <CustomCursor />
            <Navbar />
            <main className="flex-grow pt-24">{children}</main>
            <Footer />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

