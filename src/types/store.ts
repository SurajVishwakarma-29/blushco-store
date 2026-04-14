export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  stock: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  category: StoreCategory;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPriceMinor: number;
  currency: string;
  quantity: number;
  stock: number;
}
