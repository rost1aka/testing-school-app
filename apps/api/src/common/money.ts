/**
 * Every amount in this application is a whole number of cents, from the
 * database column through the DTO to the assertion in a test. Cents are
 * exact in a double where a decimal currency amount is not: 0.1 + 0.2 is
 * famously not 0.3, and a cart that adds three lines of 19.99 in floats ends
 * up a cent away from what the customer was shown.
 */

export function lineTotalCents(unitPriceCents: number, quantity: number): number {
  return unitPriceCents * quantity;
}

/**
 * What a percentage sale takes off one cart line: the amount off one of the
 * product, for as many of them as the line holds.
 */
export function lineDiscountCents(
  unitPriceCents: number,
  quantity: number,
  discountPercent: number,
): number {
  const offEachUnit = Math.round(unitPriceCents * (discountPercent / 100));
  return offEachUnit * quantity;
}

/** What one of a product costs today: its list price, less any sale. */
export function effectivePriceCents(priceCents: number, discountPercent: number): number {
  return priceCents - lineDiscountCents(priceCents, 1, discountPercent);
}

export interface CartLineAmounts {
  unitPriceCents: number;
  quantity: number;
  discountPercent: number;
}

export interface CartAmounts {
  subtotalCents: number;
  discountCents: number;
  payableCents: number;
}

export function cartTotals(lines: CartLineAmounts[]): CartAmounts {
  let subtotalCents = 0;
  let discountCents = 0;

  for (const line of lines) {
    subtotalCents += lineTotalCents(line.unitPriceCents, line.quantity);
    discountCents += lineDiscountCents(line.unitPriceCents, line.quantity, line.discountPercent);
  }

  return { subtotalCents, discountCents, payableCents: subtotalCents - discountCents };
}
