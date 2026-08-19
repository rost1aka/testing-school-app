import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { CartModule } from "./cart/cart.module";
import { CatalogModule } from "./catalog/catalog.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CatalogModule, CartModule],
  controllers: [AppController],
})
export class AppModule {}
