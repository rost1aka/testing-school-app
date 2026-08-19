import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { jwtOptions } from "../common/jwt-options";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

// JwtModule is registered here rather than imported from AuthModule on
// purpose: AuthModule needs CartService to hand a signed-out visitor's cart
// to the account they just signed in to, and two modules that import each
// other need forwardRef in both directions to resolve at all. Registering
// the same options in both keeps the graph a tree.
@Module({
  imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
