import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MailModule } from "../mail/mail.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    // registerAsync, not register: `register` reads process.env while this
    // file is being *imported*, which makes correctness depend on whether the
    // .env file happened to be loaded by some earlier import. The factory runs
    // when the module is instantiated instead, by which point main.ts (or the
    // e2e globalSetup) has definitely loaded apps/api/.env.
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          // Without this, JwtModule signs with `undefined`, which jsonwebtoken
          // accepts: the app boots, issues tokens nobody can verify, and fails
          // much later with an unrelated-looking 401.
          throw new Error(
            "JWT_SECRET is not set. Copy apps/api/.env.example to apps/api/.env, or set JWT_SECRET in the environment.",
          );
        }
        return { secret, signOptions: { expiresIn: "15m" } };
      },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // JwtModule is re-exported alongside the guard: JwtAuthGuard depends on
  // JwtService, and a module that imports AuthModule only to use
  // `@UseGuards(JwtAuthGuard)` needs that dependency resolvable too.
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
