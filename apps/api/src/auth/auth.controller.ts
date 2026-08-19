import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
  loginSchema,
  LoginInput,
  registerSchema,
  RegisterInput,
  resetPasswordSchema,
  ResetPasswordInput,
} from "@school/shared";
import { CART_COOKIE, CART_COOKIE_OPTIONS } from "../cart/cart-cookie";
import { CartService } from "../cart/cart.service";
import { cookieSecurity } from "../common/config";
import { AppError } from "../common/error-response";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "./auth.service";

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  path: "/",
};

// AUTH-03: "an access token valid for 15 minutes and a refresh token valid for
// 30 days". Without an explicit maxAge both cookies are *session* cookies —
// the browser drops them when it closes, and the documented lifetimes are not
// observable in the response at all. These are plain constants on purpose:
// they describe the cookie the client is told to keep, and must not be tangled
// up with how the server computes a token's own expiry.
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Built per request rather than once at module load: `SameSite` and `Secure`
// depend on whether the web app is served from another site, which is a fact
// about the environment. A module-level constant would freeze whichever value
// happened to be set when this file was first imported, which is also what
// makes the two cases untestable in a single process.
function cookieOptions(maxAge?: number): CookieOptions {
  return {
    ...BASE_COOKIE_OPTIONS,
    ...cookieSecurity(process.env),
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

const accessCookieOptions = (): CookieOptions => cookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE_MS);
const refreshCookieOptions = (): CookieOptions => cookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE_MS);

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
  ) {}

  @Post("register")
  @HttpCode(201)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ id: string }> {
    const { id, accessToken, refreshToken } = await this.authService.register(body);
    await this.claimGuestCart(id, req, res);
    res.cookie("access_token", accessToken, accessCookieOptions());
    res.cookie("refresh_token", refreshToken, refreshCookieOptions());
    return { id };
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken, userId } = await this.authService.login(body);
    await this.claimGuestCart(userId, req, res);
    res.cookie("access_token", accessToken, accessCookieOptions());
    res.cookie("refresh_token", refreshToken, refreshCookieOptions());
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const presentedToken: string | undefined = req.cookies?.refresh_token;
    if (!presentedToken) {
      throw new AppError("INVALID_SESSION", "Please sign in again", 401);
    }

    const { accessToken, refreshToken } = await this.authService.refresh(presentedToken);
    res.cookie("access_token", accessToken, accessCookieOptions());
    res.cookie("refresh_token", refreshToken, refreshCookieOptions());
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const presentedToken: string | undefined = req.cookies?.refresh_token;
    if (presentedToken) {
      await this.authService.logout(presentedToken);
    }

    res.clearCookie("access_token", cookieOptions());
    res.clearCookie("refresh_token", cookieOptions());
  }

  @Post("forgot-password")
  @HttpCode(202)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput,
  ): Promise<void> {
    await this.authService.requestPasswordReset(body.email);
  }

  @Post("reset-password")
  @HttpCode(204)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput,
  ): Promise<void> {
    await this.authService.resetPassword(body.token, body.password);
  }

  /**
   * CART-05: whatever this browser put in a cart while signed out belongs to
   * the account that has just signed in, and is added to anything already
   * there. The cookie goes afterwards — the cart hangs off the account now,
   * and leaving the token behind would have the next signed-out visit on
   * this browser reopen a cart that is no longer its own.
   */
  private async claimGuestCart(userId: string, req: Request, res: Response): Promise<void> {
    const guestToken: string | undefined = req.cookies?.[CART_COOKIE];
    if (!guestToken) return;

    await this.cartService.claimGuestCart(userId, guestToken);
    res.clearCookie(CART_COOKIE, CART_COOKIE_OPTIONS);
  }
}
