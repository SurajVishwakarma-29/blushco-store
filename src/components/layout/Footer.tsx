import Link from "next/link";
import { ArrowUpRight, Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background text-foreground border-t border-border mt-24">
      <div className="container mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Link href="/" className="text-4xl font-black tracking-tighter uppercase inline-block">
              BlushCo.
            </Link>
            <p className="text-muted-foreground text-lg max-w-sm">
              Academic cloud commerce project focused on secure architecture, simulation checkout, and user-first UX.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors w-full"
                required
              />
              <button
                type="submit"
                className="bg-foreground text-background font-bold tracking-widest px-6 py-3 hover:bg-muted-foreground transition-colors flex items-center justify-center shrink-0"
              >
                JOIN <ArrowUpRight className="ml-2 w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold tracking-widest uppercase text-sm">Shop</h4>
            <nav className="flex flex-col gap-4 text-muted-foreground">
              <Link href="/shop" className="hover:text-foreground transition-colors">New Arrivals</Link>
              <Link href="/shop" className="hover:text-foreground transition-colors">Best Sellers</Link>
              <Link href="/shop?category=outerwear" className="hover:text-foreground transition-colors">Outerwear</Link>
              <Link href="/shop?category=bottoms" className="hover:text-foreground transition-colors">Bottoms</Link>
              <Link href="/shop?category=accessories" className="hover:text-foreground transition-colors">Accessories</Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold tracking-widest uppercase text-sm">Project</h4>
            <nav className="flex flex-col gap-4 text-muted-foreground">
              <Link href="/shop" className="hover:text-foreground transition-colors">Explore Catalog</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Architecture Demo</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Simulation Checkout</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Security Fundamentals</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Cloud Integration</Link>
            </nav>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} BLUSHCO. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-6">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

