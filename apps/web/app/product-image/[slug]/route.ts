import { productImageSvg } from "../../../lib/product-image";

/**
 * Serves a product's cover art. The picture is a function of the slug in the
 * URL, so it needs no storage and no image host — and it can be cached hard,
 * because the same URL can never produce a different picture.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return new Response(productImageSvg(slug), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
