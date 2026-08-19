export type FieldErrors = Record<string, string[]>;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export type SortOption = "name_asc" | "price_asc" | "price_desc";

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  discountPercent: number;
  effectivePriceCents: number;
  imageUrl: string;
  stock: number;
  categories: Category[];
}

export interface CataloguePage {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CartLine {
  id: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPriceCents: number;
  discountPercent: number;
  quantity: number;
  lineTotalCents: number;
  discountCents: number;
  payableCents: number;
}

export interface Cart {
  id: string | null;
  itemCount: number;
  lines: CartLine[];
  subtotalCents: number;
  discountCents: number;
  payableCents: number;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
