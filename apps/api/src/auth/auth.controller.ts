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
import { AppError } from "../common/error-response";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "./auth.service";

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: false,
};

// AUTH-03: "an access token valid for 15 minutes and a refresh token valid for
// 30 days". Without an explicit maxAge both cookies are *session* cookies —
// the browser drops them when it closes, and the documented lifetimes are not
// observable in the response at all. These are plain constants on purpose:
// they describe the cookie the client is told to keep, and must not be tangled
// up with how the server computes a token's own expiry.
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  ...COOKIE_OPTIONS,
  maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
};

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  ...COOKIE_OPTIONS,
  maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(201)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ id: string }> {
    const { id, accessToken, refreshToken } = await this.authService.register(body);
    res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);
    return { id };
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.login(body);
    res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const presentedToken: string | undefined = req.cookies?.refresh_token;
    if (!presentedToken) {
      throw new AppError("INVALID_SESSION", "Please sign in again", 401);
    }

    const { accessToken, refreshToken } = await this.authService.refresh(presentedToken);
    res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const presentedToken: string | undefined = req.cookies?.refresh_token;
    if (presentedToken) {
      await this.authService.logout(presentedToken);
    }

    res.clearCookie("access_token", COOKIE_OPTIONS);
    res.clearCookie("refresh_token", COOKIE_OPTIONS);
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
}
