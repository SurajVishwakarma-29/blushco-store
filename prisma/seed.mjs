import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Outerwear",
    slug: "outerwear",
    description: "Engineered layers for all-weather urban wear.",
  },
  {
    name: "Tops",
    slug: "tops",
    description: "Everyday silhouettes with elevated material choices.",
  },
  {
    name: "Bottoms",
    slug: "bottoms",
    description: "Functional fits balancing comfort, movement, and structure.",
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Minimal add-ons to complete modern street looks.",
  },
];

const products = [
  {
    name: "Modular Utility Jacket",
    slug: "modular-utility-jacket",
    description: "Heavy-weight shell with detachable hood and tactical pocket layout.",
    priceMinor: 18000,
    stock: 35,
    images: ["/images/jacket_1.png", "/images/jacket_2.png", "/images/jacket_3.png"],
    categorySlug: "outerwear",
    isFeatured: true,
  },
  {
    name: "Stealth Tech Vest",
    slug: "stealth-tech-vest",
    description: "Layered vest with water-resistant finish and breathable mesh lining.",
    priceMinor: 14500,
    stock: 30,
    images: ["/images/jacket_2.png", "/images/jacket_1.png"],
    categorySlug: "outerwear",
    isFeatured: false,
  },
  {
    name: "Transit Bomber Coat",
    slug: "transit-bomber-coat",
    description: "Urban bomber shell with structured shoulders and matte hardware.",
    priceMinor: 17200,
    stock: 22,
    images: ["/images/jacket_3.png", "/images/jacket_1.png"],
    categorySlug: "outerwear",
    isFeatured: true,
  },
  {
    name: "Neon Windbreaker Shell",
    slug: "neon-windbreaker-shell",
    description: "Ultra-light windbreaker with reflective trim and hidden hood.",
    priceMinor: 13600,
    stock: 24,
    images: ["/images/jacket_2.png", "/images/jacket_3.png"],
    categorySlug: "outerwear",
    isFeatured: false,
  },
  {
    name: "Gridline Denim Jacket",
    slug: "gridline-denim-jacket",
    description: "Relaxed denim jacket with contrast seam grid and soft-wash finish.",
    priceMinor: 15800,
    stock: 18,
    images: ["/images/jacket_1.png", "/images/jacket_2.png"],
    categorySlug: "outerwear",
    isFeatured: false,
  },
  {
    name: "Acid Wash Heavy Hoodie",
    slug: "acid-wash-heavy-hoodie",
    description: "Oversized pullover hoodie in dense cotton fleece with drop shoulders.",
    priceMinor: 12000,
    stock: 40,
    images: ["/images/hoodie_1.png", "/images/jacket_3.png"],
    categorySlug: "tops",
    isFeatured: true,
  },
  {
    name: "Oversized Graphic Tee",
    slug: "oversized-graphic-tee",
    description: "Structured tee featuring monochrome artwork and relaxed drape.",
    priceMinor: 6000,
    stock: 60,
    images: ["/images/hoodie_1.png"],
    categorySlug: "tops",
    isFeatured: false,
  },
  {
    name: "Boxy Layer Tee",
    slug: "boxy-layer-tee",
    description: "Boxy street tee built for layering with dropped sleeves.",
    priceMinor: 6800,
    stock: 55,
    images: ["/images/hoodie_1.png", "/images/jacket_1.png"],
    categorySlug: "tops",
    isFeatured: false,
  },
  {
    name: "Zip Mock Sweatshirt",
    slug: "zip-mock-sweatshirt",
    description: "Quarter-zip sweatshirt with brushed interior and utility pocket.",
    priceMinor: 9900,
    stock: 33,
    images: ["/images/hoodie_1.png", "/images/jacket_2.png"],
    categorySlug: "tops",
    isFeatured: true,
  },
  {
    name: "Ribbed Cropped Tank",
    slug: "ribbed-cropped-tank",
    description: "Ribbed stretch tank with clean hem and snug athletic fit.",
    priceMinor: 5200,
    stock: 48,
    images: ["/images/hoodie_1.png", "/images/jacket_3.png"],
    categorySlug: "tops",
    isFeatured: false,
  },
  {
    name: "Tactical Cargo Pants",
    slug: "tactical-cargo-pants",
    description: "Straight-leg cargos with articulated knees and adjustable hem toggles.",
    priceMinor: 15000,
    stock: 45,
    images: ["/images/pants_1.png", "/images/pants_2.png"],
    categorySlug: "bottoms",
    isFeatured: true,
  },
  {
    name: "Wide-Leg Cargos",
    slug: "wide-leg-cargos",
    description: "Wide-leg utility bottoms with pleated front and deep cargo pockets.",
    priceMinor: 14000,
    stock: 25,
    images: ["/images/pants_2.png", "/images/pants_1.png"],
    categorySlug: "bottoms",
    isFeatured: true,
  },
  {
    name: "Parachute Pants",
    slug: "parachute-pants",
    description: "Lightweight parachute silhouette with drawcord waist and ankle cinch.",
    priceMinor: 13000,
    stock: 28,
    images: ["/images/pants_1.png"],
    categorySlug: "bottoms",
    isFeatured: false,
  },
  {
    name: "Relaxed Carpenter Denim",
    slug: "relaxed-carpenter-denim",
    description: "Wide carpenter denim with reinforced seams and utility loops.",
    priceMinor: 12400,
    stock: 29,
    images: ["/images/pants_2.png", "/images/pants_1.png"],
    categorySlug: "bottoms",
    isFeatured: false,
  },
  {
    name: "Tech Jogger Utility",
    slug: "tech-jogger-utility",
    description: "Tapered joggers with water-repellent stretch fabric and zip pockets.",
    priceMinor: 11200,
    stock: 31,
    images: ["/images/pants_1.png", "/images/pants_2.png"],
    categorySlug: "bottoms",
    isFeatured: false,
  },
  {
    name: "Pleated Track Trousers",
    slug: "pleated-track-trousers",
    description: "Smart track trousers with front pleats and easy movement fit.",
    priceMinor: 10600,
    stock: 27,
    images: ["/images/pants_2.png", "/images/pants_1.png"],
    categorySlug: "bottoms",
    isFeatured: false,
  },
  {
    name: "Utility Crossbody",
    slug: "utility-crossbody",
    description: "Compact crossbody with quick-release strap and reinforced compartments.",
    priceMinor: 8500,
    stock: 20,
    images: ["/images/jacket_2.png"],
    categorySlug: "accessories",
    isFeatured: false,
  },
  {
    name: "Reflective Sling Bag",
    slug: "reflective-sling-bag",
    description: "Angular sling bag with reflective weave and anti-theft hidden pocket.",
    priceMinor: 9200,
    stock: 19,
    images: ["/images/jacket_1.png", "/images/jacket_2.png"],
    categorySlug: "accessories",
    isFeatured: true,
  },
  {
    name: "Canvas Bucket Hat",
    slug: "canvas-bucket-hat",
    description: "Structured bucket hat with stitched brim and breathable eyelets.",
    priceMinor: 4200,
    stock: 50,
    images: ["/images/jacket_3.png", "/images/hoodie_1.png"],
    categorySlug: "accessories",
    isFeatured: false,
  },
  {
    name: "Urban Utility Belt",
    slug: "urban-utility-belt",
    description: "Durable nylon belt with alloy quick-lock buckle and modular loops.",
    priceMinor: 3900,
    stock: 65,
    images: ["/images/jacket_2.png", "/images/pants_1.png"],
    categorySlug: "accessories",
    isFeatured: false,
  },
  {
    name: "Minimal Card Holder",
    slug: "minimal-card-holder",
    description: "Slim card holder in textured vegan leather with snap closure.",
    priceMinor: 2800,
    stock: 70,
    images: ["/images/jacket_1.png", "/images/jacket_3.png"],
    categorySlug: "accessories",
    isFeatured: false,
  },
];

async function main() {
  const createdCategories = new Map();

  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });

    createdCategories.set(category.slug, record.id);
  }

  for (const product of products) {
    const categoryId = createdCategories.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category for product ${product.slug}`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        priceMinor: product.priceMinor,
        stock: product.stock,
        images: product.images,
        categoryId,
        isFeatured: product.isFeatured,
        isActive: true,
        currency: "INR",
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceMinor: product.priceMinor,
        stock: product.stock,
        images: product.images,
        categoryId,
        isFeatured: product.isFeatured,
        isActive: true,
        currency: "INR",
      },
    });
  }

  console.log(`Seed complete: ${categories.length} categories, ${products.length} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
