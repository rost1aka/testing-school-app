import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import { loginSchema, LoginInput, registerSchema, RegisterInput } from "@school/shared";
import { AppError } from "../common/error-response";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "./auth.service";

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: false,
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
    res.cookie("access_token", accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);
    return { id };
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.login(body);
    res.cookie("access_token", accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const presentedToken: string | undefined = req.cookies?.refresh_token;
    if (!presentedToken) {
      throw new AppError("INVALID_SESSION", "Please sign in again", 401);
    }

    const { accessToken, refreshToken } = await this.authService.refresh(presentedToken);
    res.cookie("access_token", accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);
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
}
