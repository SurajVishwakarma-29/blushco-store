import Image from "next/image";
import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { getProductByIdOrSlug } from "@/lib/storefront/queries";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product = await getProductByIdOrSlug(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 md:py-24">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        <div className="lg:w-[60%] flex gap-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:grid lg:grid-cols-2 hide-scrollbar">
          {product.images.map((image, index) => (
            <div
              key={`${product.id}-${index}`}
              className={`relative bg-muted shrink-0 w-[85vw] lg:w-full snap-center ${
                index === 0 ? "lg:col-span-2 aspect-[3/4] lg:aspect-[4/5]" : "aspect-square"
              } overflow-hidden`}
            >
              <Image
                src={image}
                alt={`${product.name} image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-200 ease-out motion-safe:hover:scale-[1.02]"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        <ProductDetailClient product={product} />
      </div>
    </div>
  );
}
