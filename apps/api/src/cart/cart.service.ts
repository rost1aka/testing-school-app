import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AddToCartInput } from "@school/shared";
import { AppError } from "../common/error-response";
import { cartTotals, lineDiscountCents, lineTotalCents } from "../common/money";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Who a cart belongs to. A signed-in visitor is identified by their user id;
 * a signed-out one by the token in their `cart_token` cookie. Neither means
 * a visitor who has never added anything and has no cart yet.
 */
export interface CartOwner {
  userId: string | null;
  guestToken: string | null;
}

export interface CartLineView {
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

export interface CartView {
  id: string | null;
  itemCount: number;
  lines: CartLineView[];
  subtotalCents: number;
  discountCents: number;
  payableCents: number;
}

const cartWithLines = {
  lines: { include: { product: true }, orderBy: { id: "asc" } },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartWithLines }>;

const EMPTY_CART: CartView = {
  id: null,
  itemCount: 0,
  lines: [],
  subtotalCents: 0,
  discountCents: 0,
  payableCents: 0,
};

function toCartView(cart: CartRow | null): CartView {
  if (!cart) return EMPTY_CART;

  const lines: CartLineView[] = cart.lines.map((line) => {
    const total = lineTotalCents(line.product.priceCents, line.quantity);
    const discount = lineDiscountCents(
      line.product.priceCents,
      line.quantity,
      line.product.discountPercent,
    );

    return {
      id: line.id,
      productId: line.productId,
      slug: line.product.slug,
      name: line.product.name,
      imageUrl: line.product.imageUrl,
      unitPriceCents: line.product.priceCents,
      discountPercent: line.product.discountPercent,
      quantity: line.quantity,
      lineTotalCents: total,
      discountCents: discount,
      payableCents: total - discount,
    };
  });

  const totals = cartTotals(
    cart.lines.map((line) => ({
      unitPriceCents: line.product.priceCents,
      quantity: line.quantity,
      discountPercent: line.product.discountPercent,
    })),
  );

  return {
    id: cart.id,
    itemCount: cart.lines.reduce((count, line) => count + line.quantity, 0),
    lines,
    ...totals,
  };
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(owner: CartOwner): Promise<CartView> {
    return toCartView(await this.findCart(this.prisma, owner));
  }

  /**
   * Puts a product in the visitor's cart, starting a cart for them if this is
   * the first thing they have added.
   */
  async addItem(owner: CartOwner, input: AddToCartInput): Promise<CartView> {
    const product = await this.prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) {
      throw new AppError("NOT_FOUND", "That product is not in the catalogue", 404);
    }

    await this.prisma.$transaction(async (tx) => {
      const cart = await this.ensureCart(tx, owner);

      await tx.cartLine.create({
        data: { cartId: cart.id, productId: input.productId, quantity: input.quantity },
      });
    });

    return this.getCart(owner);
  }

  async setQuantity(owner: CartOwner, lineId: string, quantity: number): Promise<CartView> {
    const line = await this.findOwnLineOrThrow(owner, lineId);

    if (quantity === 0) {
      await this.prisma.cartLine.delete({ where: { id: line.id } });
    } else {
      await this.prisma.cartLine.update({ where: { id: line.id }, data: { quantity } });
    }

    return this.getCart(owner);
  }

  async removeLine(owner: CartOwner, lineId: string): Promise<CartView> {
    const line = await this.findOwnLineOrThrow(owner, lineId);
    await this.prisma.cartLine.delete({ where: { id: line.id } });
    return this.getCart(owner);
  }

  /**
   * Hands the cart a browser built while signed out to the account that just
   * signed in. When the account already has a cart, the two are added
   * together line by line — the visitor chose everything in both, so
   * throwing either away loses something they asked for.
   */
  async claimGuestCart(userId: string, guestToken: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const guestCart = await tx.cart.findUnique({
        where: { token: guestToken },
        include: { lines: true },
      });
      if (!guestCart) return;

      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (!userCart) {
        await tx.cart.update({
          where: { id: guestCart.id },
          data: { userId, token: null },
        });
        return;
      }

      for (const line of guestCart.lines) {
        const existing = await tx.cartLine.findFirst({
          where: { cartId: userCart.id, productId: line.productId },
        });

        if (existing) {
          await tx.cartLine.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + line.quantity },
          });
        } else {
          await tx.cartLine.create({
            data: { cartId: userCart.id, productId: line.productId, quantity: line.quantity },
          });
        }
      }

      await tx.cart.delete({ where: { id: guestCart.id } });
    });
  }

  private findCart(
    client: Prisma.TransactionClient | PrismaService,
    owner: CartOwner,
  ): Promise<CartRow | null> {
    if (owner.userId) {
      return client.cart.findUnique({ where: { userId: owner.userId }, include: cartWithLines });
    }
    if (owner.guestToken) {
      return client.cart.findUnique({ where: { token: owner.guestToken }, include: cartWithLines });
    }
    return Promise.resolve(null);
  }

  private async ensureCart(tx: Prisma.TransactionClient, owner: CartOwner): Promise<{ id: string }> {
    const existing = await this.findCart(tx, owner);
    if (existing) return existing;

    if (owner.userId) {
      return tx.cart.create({ data: { userId: owner.userId } });
    }
    if (owner.guestToken) {
      return tx.cart.create({ data: { token: owner.guestToken } });
    }

    // The controller issues a guest token before any write, so there is
    // always one of the two. Reaching here would mean a caller invented its
    // own owner, and silently creating an orphan cart would hide that.
    throw new AppError("NO_CART", "This request has no cart to write to", 400);
  }

  /**
   * A line id nobody can be shown to own answers exactly as one that does not
   * exist: a 404 either way, so that guessing ids tells you nothing about
   * what is in anybody else's cart.
   */
  private async findOwnLineOrThrow(owner: CartOwner, lineId: string): Promise<{ id: string }> {
    const cart = await this.findCart(this.prisma, owner);
    const line = cart?.lines.find((candidate) => candidate.id === lineId);

    if (!line) {
      throw new AppError("NOT_FOUND", "That item is not in your cart", 404);
    }
    return line;
  }
}
