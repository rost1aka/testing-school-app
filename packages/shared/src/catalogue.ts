import { z } from "zod";

export const SORT_OPTIONS = ["name_asc", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/**
 * A query string carries everything as text, and an unset filter arrives as
 * an empty value rather than as a missing key — `?minPrice=&sort=` is what a
 * form with blank fields submits. `Number("")` is 0, not NaN, so a bare
 * `z.coerce.number()` would read a blank minimum price as "at least 0 cents"
 * and quietly change what was asked for. Blank means absent.
 */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(blankToUndefined, z.string().trim().min(1).optional());

const optionalCents = z.preprocess(
  blankToUndefined,
  z.coerce
    .number()
    .int("Enter a whole number of cents")
    .min(0, "Prices cannot be negative")
    .optional(),
);

export const catalogueQuerySchema = z.object({
  q: optionalText,
  category: optionalText,
  minPrice: optionalCents,
  maxPrice: optionalCents,
  sort: z.preprocess(blankToUndefined, z.enum(SORT_OPTIONS).default("name_asc")),
  page: z.preprocess(
    blankToUndefined,
    z.coerce.number().int("Page must be a whole number").min(1, "Page must be at least 1").default(1),
  ),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .default(1),
});

// Unlike an add, an update accepts 0: it is how a line is emptied from the
// cart page's quantity control, and the API removes the line rather than
// storing a line of nothing.
export const updateCartLineSchema = z.object({
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
});

export type CatalogueQuery = z.infer<typeof catalogueQuerySchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartLineInput = z.infer<typeof updateCartLineSchema>;
