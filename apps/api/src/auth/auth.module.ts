import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MailModule } from "../mail/mail.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "15m" },
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
