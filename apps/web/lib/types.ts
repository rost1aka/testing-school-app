export type FieldErrors = Record<string, string[]>;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
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
