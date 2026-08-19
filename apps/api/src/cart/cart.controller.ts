import { randomUUID } from "node:crypto";
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, Res } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import {
  addToCartSchema,
  AddToCartInput,
  updateCartLineSchema,
  UpdateCartLineInput,
} from "@school/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CART_COOKIE, CART_COOKIE_OPTIONS } from "./cart-cookie";
import { CartOwner, CartService, CartView } from "./cart.service";

@Controller("cart")
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async get(@Req() req: Request): Promise<CartView> {
    return this.cartService.getCart(await this.readOwner(req));
  }

  // 200, not 201: what comes back is the whole cart as it now stands, which
  // is what the page renders, rather than a newly created line resource.
  @Post("items")
  @HttpCode(200)
  async addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(addToCartSchema)) body: AddToCartInput,
  ): Promise<CartView> {
    return this.cartService.addItem(await this.writeOwner(req, res), body);
  }

  @Patch("items/:id")
  async setQuantity(
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCartLineSchema)) body: UpdateCartLineInput,
  ): Promise<CartView> {
    return this.cartService.setQuantity(await this.readOwner(req), id, body.quantity);
  }

  @Delete("items/:id")
  async removeLine(@Req() req: Request, @Param("id") id: string): Promise<CartView> {
    return this.cartService.removeLine(await this.readOwner(req), id);
  }

  /**
   * The cart is the one part of the application a signed-out visitor may
   * write to, so it resolves the session itself instead of standing behind
   * `JwtAuthGuard`: a missing or expired access token is not an error here,
   * it means the cart belongs to the browser rather than to an account.
   */
  private async readOwner(req: Request): Promise<CartOwner> {
    const token: string | undefined = req.cookies?.access_token;

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
        return { userId: payload.sub, guestToken: null };
      } catch {
        // Falls through to the signed-out case below.
      }
    }

    return { userId: null, guestToken: req.cookies?.[CART_COOKIE] ?? null };
  }

  /**
   * A write needs somewhere to write to. A signed-out visitor who has never
   * had a cart gets a token now, and the cookie that will bring them back to
   * it. Reads never issue one: a visitor only looking at their cart should
   * not collect a cookie for a cart that does not exist.
   */
  private async writeOwner(req: Request, res: Response): Promise<CartOwner> {
    const owner = await this.readOwner(req);
    if (owner.userId || owner.guestToken) return owner;

    const guestToken = randomUUID();
    res.cookie(CART_COOKIE, guestToken, CART_COOKIE_OPTIONS);
    return { userId: null, guestToken };
  }
}
