/**
 * Cover art for a product, drawn from its slug alone.
 *
 * The shop has no uploaded photographs, and pulling them from an image host
 * would make every catalogue render — and every browser test — depend on the
 * network being up. Deriving a picture from the slug keeps the catalogue
 * offline, gives each product its own recognisable tile, and stays fixed:
 * the same slug is the same picture on every machine and in every run.
 */

/** FNV-1a, so a slug always lands on the same colour. */
function hash(slug: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < slug.length; index += 1) {
    value ^= slug.charCodeAt(index);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

/** "desk-lamp" → "DL", "kite" → "K". */
export function initialsFrom(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/**
 * The colours are generated rather than taken from the Tailwind theme on
 * purpose: this is product artwork, one hue per product, not chrome — the
 * card around it is what carries the app's palette.
 */
export function productImageSvg(slug: string): string {
  const hue = hash(slug) % 360;
  const background = `hsl(${hue} 64% 93%)`;
  const shape = `hsl(${hue} 52% 78%)`;
  const ink = `hsl(${hue} 46% 34%)`;
  const initials = initialsFrom(slug);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="presentation">
  <rect width="400" height="300" fill="${background}"/>
  <circle cx="316" cy="66" r="86" fill="${shape}" opacity="0.75"/>
  <rect x="-20" y="214" width="440" height="120" rx="48" fill="${shape}" opacity="0.6"/>
  <text x="200" y="170" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="112" font-weight="600" fill="${ink}">${initials}</text>
</svg>`;
}
