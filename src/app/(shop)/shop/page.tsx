import Link from "next/link";

import { ProductCard } from "@/components/shop/ProductCard";
import { getCategories, getProducts } from "@/lib/storefront/queries";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category, q } = await searchParams;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: category,
      search: q,
    }),
  ]);

  return (
    <div className="container mx-auto px-6 md:px-12 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mix-blend-difference">Shop All</h1>
          <p className="text-muted-foreground mt-4 max-w-md">
            Live catalog from Supabase + Prisma. Checkout is simulated for cloud and security coursework.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/shop"
          className={`px-4 py-2 border text-xs uppercase tracking-widest transition-colors ${
            !category ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
          }`}
        >
          All
        </Link>
        {categories.map((item) => (
          <Link
            key={item.id}
            href={`/shop?category=${encodeURIComponent(item.slug)}`}
            className={`px-4 py-2 border text-xs uppercase tracking-widest transition-colors ${
              category === item.slug
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:border-foreground"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="border border-border p-10 text-center">
          <p className="font-bold uppercase tracking-widest mb-2">No products found</p>
          <p className="text-sm text-muted-foreground">Run `npm run db:seed` after applying migrations to load starter catalog data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
