import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().min(5, "Enter a valid phone number").optional(),
});

export const addressInputSchema = z.object({
  label: z.string().min(1, "Label is required"),
  line1: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().length(2, "Use a two-letter country code"),
  isDefault: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
