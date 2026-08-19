/**
 * The shop's fixed contents: five categories and 61 products, in a fixed
 * order, with no faker, no randomness and no wall-clock — so every machine
 * sees byte-identical data and anything the catalogue does is reproducible
 * from this file alone.
 *
 * It lives apart from `seed.ts` because two scripts need it: the full reset
 * that development uses, and the catalogue-only top-up that is safe to run
 * against a deployment holding real accounts.
 */

// Cover art is drawn by the web app from the product's slug rather than
// fetched from an image host, so each product has its own picture and nothing
// in the catalogue depends on the network being up.
const imageUrlFor = (slug: string) => `/product-image/${slug}`;

const CATEGORIES = [
  { id: "cat_electronics", slug: "electronics", name: "Electronics" },
  { id: "cat_furniture", slug: "furniture", name: "Furniture" },
  { id: "cat_toys", slug: "toys", name: "Toys" },
  { id: "cat_books", slug: "books", name: "Books" },
  { id: "cat_garden", slug: "garden", name: "Garden" },
];

interface SeedProduct {
  slug: string;
  name: string;
  priceCents: number;
  stock: number;
  categories: string[];
  discountPercent?: number;
}

// Fixed rows, in a fixed order: no faker, no randomness, no wall-clock, so
// every machine sees byte-identical data and anything the catalogue does is
// reproducible from the seed alone.
const PRODUCTS: SeedProduct[] = [
  { slug: "iphone-dock", name: "iPhone dock", priceCents: 1999, discountPercent: 25, stock: 40, categories: ["electronics"] },
  { slug: "usb-c-cable", name: "USB-C cable", priceCents: 899, stock: 120, categories: ["electronics"] },
  { slug: "desk-lamp", name: "Desk lamp", priceCents: 3450, stock: 25, categories: ["electronics", "furniture"] },
  { slug: "bluetooth-speaker", name: "Bluetooth speaker", priceCents: 5990, discountPercent: 10, stock: 18, categories: ["electronics"] },
  { slug: "headphones", name: "Noise-cancelling headphones", priceCents: 18900, stock: 7, categories: ["electronics"] },
  { slug: "wireless-mouse", name: "Wireless mouse", priceCents: 2450, stock: 60, categories: ["electronics"] },
  { slug: "mechanical-keyboard", name: "Mechanical keyboard", priceCents: 8900, discountPercent: 15, stock: 12, categories: ["electronics"] },
  { slug: "webcam", name: "1080p webcam", priceCents: 4200, stock: 30, categories: ["electronics"] },
  { slug: "power-bank", name: "Power bank", priceCents: 3299, stock: 44, categories: ["electronics"] },
  { slug: "smart-bulb", name: "Smart bulb", priceCents: 1499, stock: 80, categories: ["electronics", "garden"] },
  { slug: "e-reader", name: "E-reader", priceCents: 11900, stock: 9, categories: ["electronics", "books"] },
  { slug: "laptop-stand", name: "Laptop stand", priceCents: 4990, stock: 22, categories: ["electronics", "furniture"] },
  { slug: "label-printer", name: "Label printer", priceCents: 7450, stock: 6, categories: ["electronics"] },
  { slug: "vinyl-turntable", name: "Vinyl turntable", priceCents: 21900, stock: 1, categories: ["electronics"] },

  { slug: "armchair", name: "Ärmchair", priceCents: 2000, stock: 5, categories: ["furniture"] },
  { slug: "oak-bookshelf", name: "Oak bookshelf", priceCents: 12900, stock: 8, categories: ["furniture", "books"] },
  { slug: "folding-chair", name: "Folding chair", priceCents: 3900, stock: 30, categories: ["furniture", "garden"] },
  { slug: "coffee-table", name: "Coffee table", priceCents: 15900, discountPercent: 10, stock: 4, categories: ["furniture"] },
  { slug: "floor-cushion", name: "Floor cushion", priceCents: 2599, stock: 26, categories: ["furniture"] },
  { slug: "shoe-rack", name: "Shoe rack", priceCents: 4599, stock: 17, categories: ["furniture"] },
  { slug: "standing-desk", name: "Standing desk", priceCents: 34900, discountPercent: 5, stock: 3, categories: ["furniture"] },
  { slug: "bar-stool", name: "Bar stool", priceCents: 6900, stock: 14, categories: ["furniture"] },
  { slug: "zebra-bookend", name: "zebra bookend", priceCents: 1250, stock: 33, categories: ["furniture", "books"] },
  { slug: "apple-crate", name: "Åpple crate", priceCents: 1899, stock: 21, categories: ["furniture", "garden"] },
  { slug: "wall-mirror", name: "Wall mirror", priceCents: 8900, stock: 11, categories: ["furniture"] },
  { slug: "nesting-tables", name: "Nesting tables", priceCents: 11900, stock: 6, categories: ["furniture"] },
  { slug: "reading-nook-lamp", name: "Reading nook lamp", priceCents: 5400, stock: 13, categories: ["furniture", "books"] },

  { slug: "wooden-train-set", name: "Wooden train set", priceCents: 4599, discountPercent: 20, stock: 16, categories: ["toys"] },
  { slug: "jigsaw-puzzle", name: "1000-piece jigsaw puzzle", priceCents: 1899, stock: 40, categories: ["toys"] },
  { slug: "plush-zebra", name: "Plush zebra", priceCents: 1599, stock: 35, categories: ["toys"] },
  { slug: "building-blocks", name: "Building blocks", priceCents: 2999, stock: 28, categories: ["toys"] },
  { slug: "kite", name: "Kite", priceCents: 1299, stock: 45, categories: ["toys", "garden"] },
  { slug: "marble-run", name: "Marble run", priceCents: 3499, stock: 19, categories: ["toys"] },
  { slug: "rubber-duck", name: "Rubber duck", priceCents: 299, stock: 90, categories: ["toys"] },
  { slug: "toy-robot", name: "Toy robot", priceCents: 5499, stock: 15, categories: ["toys", "electronics"] },
  { slug: "settlers-board-game", name: "Settlers board game", priceCents: 4299, stock: 20, categories: ["toys"] },
  { slug: "yo-yo", name: "Yo-yo", priceCents: 799, stock: 55, categories: ["toys"] },
  { slug: "dollhouse", name: "Dollhouse", priceCents: 9900, stock: 5, categories: ["toys", "furniture"] },
  { slug: "finger-paints", name: "Finger paints", priceCents: 1199, stock: 38, categories: ["toys"] },

  { slug: "paper-clip", name: "Paper clip", priceCents: 7, stock: 500, categories: ["books"] },
  { slug: "pocket-notebook", name: "Pocket notebook", priceCents: 499, stock: 75, categories: ["books"] },
  { slug: "everyday-cookbook", name: "Everyday cookbook", priceCents: 2899, stock: 24, categories: ["books"] },
  { slug: "atlas-of-rivers", name: "Atlas of rivers", priceCents: 3599, stock: 10, categories: ["books"] },
  { slug: "poetry-anthology", name: "Poetry anthology", priceCents: 1799, stock: 18, categories: ["books"] },
  { slug: "sketchbook", name: "Sketchbook", priceCents: 1350, stock: 42, categories: ["books", "toys"] },
  { slug: "history-of-clocks", name: "A history of clocks", priceCents: 2450, stock: 12, categories: ["books"] },
  { slug: "gardening-almanac", name: "Gardening almanac", priceCents: 2199, stock: 16, categories: ["books", "garden"] },
  { slug: "childrens-fables", name: "Children's fables", priceCents: 1650, stock: 27, categories: ["books", "toys"] },
  { slug: "crossword-collection", name: "Crossword collection", priceCents: 999, stock: 34, categories: ["books"] },
  { slug: "fountain-pen", name: "Fountain pen", priceCents: 4900, stock: 13, categories: ["books"] },
  { slug: "bookmark-set", name: "Bookmark set", priceCents: 350, stock: 66, categories: ["books"] },

  { slug: "watering-can", name: "Watering can", priceCents: 1899, stock: 29, categories: ["garden"] },
  { slug: "seed-tray", name: "Seed tray", priceCents: 650, stock: 48, categories: ["garden"] },
  { slug: "pruning-shears", name: "Pruning shears", priceCents: 2750, stock: 21, categories: ["garden"] },
  { slug: "terracotta-pot", name: "Terracotta pot", priceCents: 1450, stock: 37, categories: ["garden"] },
  { slug: "garden-gnome", name: "Garden gnome", priceCents: 2299, stock: 14, categories: ["garden", "toys"] },
  { slug: "compost-bin", name: "Compost bin", priceCents: 5900, stock: 9, categories: ["garden"] },
  { slug: "hose-reel", name: "Hose reel", priceCents: 4450, stock: 11, categories: ["garden"] },
  { slug: "bird-feeder", name: "Bird feeder", priceCents: 1999, stock: 23, categories: ["garden"] },
  { slug: "wildflower-seeds", name: "Wildflower seeds", priceCents: 399, stock: 88, categories: ["garden"] },
  { slug: "sun-hat", name: "Sun hat", priceCents: 1799, stock: 31, categories: ["garden"] },
];

const categoryIdBySlug = new Map(CATEGORIES.map((category) => [category.slug, category.id]));
const productId = (slug: string) => `prd_${slug.replace(/-/g, "_")}`;

export { CATEGORIES, PRODUCTS, categoryIdBySlug, imageUrlFor, productId };
export type { SeedProduct };
