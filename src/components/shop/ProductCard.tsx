import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatMoneyFromMinor } from "@/lib/storefront/currency";
import type { StoreProduct } from "@/types/store";

export function ProductCard({ product }: { product: StoreProduct }) {
  return (
    <div key={product.id} className="group cursor-pointer block">
      <div className="relative aspect-[3/4] bg-muted overflow-hidden mb-4">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10">
          <Image
            src={product.images[0] || "/images/jacket_1.png"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 ease-out motion-reduce:transition-none flex gap-2 z-20">
          <AddToCartButton
            product={product}
            className="flex-1 bg-background text-foreground font-bold tracking-widest py-3 uppercase text-xs hover:bg-neutral-200 transition-colors"
          />
        </div>
      </div>
      <div className="flex justify-between items-start gap-4">
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-bold tracking-tighter uppercase text-sm leading-tight group-hover:underline underline-offset-4">
              {product.name}
            </h3>
          </Link>
          <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest">
            {product.category.name}
          </p>
        </div>
        <span className="font-medium text-sm whitespace-nowrap">
          {formatMoneyFromMinor(product.priceMinor, product.currency)}
        </span>
      </div>
    </div>
  );
}
