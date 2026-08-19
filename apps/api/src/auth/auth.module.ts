import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { CartModule } from "../cart/cart.module";
import { jwtOptions } from "../common/jwt-options";
import { MailModule } from "../mail/mail.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    // registerAsync, not register: `register` would read process.env while
    // this file is being *imported*, which makes correctness depend on
    // whether the .env file happened to be loaded by some earlier import.
    // The factory runs when the module is instantiated instead, by which
    // point main.ts (or the e2e globalSetup) has definitely loaded
    // apps/api/.env.
    JwtModule.registerAsync({ useFactory: jwtOptions }),
    MailModule,
    // Signing in hands over the cart the browser built while signed out.
    CartModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // JwtModule is re-exported alongside the guard: JwtAuthGuard depends on
  // JwtService, and a module that imports AuthModule only to use
  // `@UseGuards(JwtAuthGuard)` needs that dependency resolvable too.
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
