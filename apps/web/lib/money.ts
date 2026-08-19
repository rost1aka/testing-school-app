// The locale is pinned rather than left to the browser's: prices come from
// the API as a whole number of cents in one currency, and a visitor whose
// browser is set to another locale should still be shown the price the shop
// charges, formatted the one way every test can assert on.
const FORMATTER = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatCents(cents: number): string {
  return FORMATTER.format(cents / 100);
}
