import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/shop/ProductCard";
import { Marquee } from "@/components/ui/Marquee";
import { getCategories, getPersonalizedProducts, getProducts } from "@/lib/storefront/queries";

export default async function Home() {
  const { userId } = await auth();

  const [categories, featuredProducts, personalizedProducts] = await Promise.all([
    getCategories(),
    getProducts({ featuredOnly: true, limit: 4 }),
    getPersonalizedProducts({ userId, limit: 4 }),
  ]);

  return (
    <>
      <section className="relative h-[90vh] md:h-screen w-full flex items-center justify-center overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0 bg-secondary/20">
          <Image
            src="/images/hero.png"
            alt="Hero Background"
            fill
            className="object-cover object-top opacity-50 grayscale mix-blend-multiply"
            priority
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 mt-16">
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black uppercase tracking-tighter leading-none mix-blend-difference mb-6">
            Future <br className="md:hidden" /> Standard
          </h1>
          <p className="text-lg md:text-xl font-medium tracking-wide max-w-lg mb-10 mix-blend-difference">
            Cloud-native e-commerce demo with secure backend patterns and simulation-first checkout.
          </p>
          <Link
            href="/shop"
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-bold tracking-widest uppercase overflow-hidden hover:opacity-90 transition-opacity"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Collection <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      <Marquee />

      <section className="py-24 container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Core Essentials</h2>
          <Link
            href="/shop"
            className="text-sm font-bold tracking-widest uppercase hover:text-muted-foreground transition-colors mt-4 md:mt-0 flex items-center gap-2"
          >
            View All Categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="border border-border p-10 text-center">
            <p className="font-bold uppercase tracking-widest mb-2">No categories yet</p>
            <p className="text-sm text-muted-foreground">Seed data to populate category and product cards.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((category, index) => (
              <Link
                key={category.id}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                className={`relative group overflow-hidden rounded-lg bg-secondary h-[340px] ${
                  index === 0 ? "md:col-span-2" : ""
                }`}
              >
                <Image
                  src={featuredProducts[index]?.images[0] || "/images/jacket_1.png"}
                  alt={category.name}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 grayscale hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/50 transition-colors" />
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{category.name}</h3>
                  <p className="text-white/80 font-medium tracking-wide text-sm mt-2">
                    {category.description || "Explore the latest lineup"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-16 text-center">
            Featured Products
          </h2>

          {featuredProducts.length === 0 ? (
            <div className="border border-background/20 p-10 text-center">
              <p className="font-bold uppercase tracking-widest mb-2">No featured products</p>
              <p className="text-sm text-background/70">Run the seed command to load starter featured inventory.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Recommended For You</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              {userId
                ? "Based on your profile age and preferences. Update My Account any time to tune recommendations."
                : "Sign in and save profile details to unlock age-aware and preference-aware recommendations."}
            </p>
          </div>

          {!userId ? (
            <Link
              href="/sign-in?redirect_url=/account"
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase border border-border px-4 py-3 hover:border-foreground"
            >
              Sign in to personalize <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase border border-border px-4 py-3 hover:border-foreground"
            >
              Update my profile <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {personalizedProducts.length === 0 ? (
          <div className="border border-border p-10 text-center">
            <p className="font-bold uppercase tracking-widest mb-2">No recommendations yet</p>
            <p className="text-sm text-muted-foreground">
              Add more catalog products and profile data to generate recommendations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalizedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
