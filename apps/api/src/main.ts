// Must come first: modules imported below read process.env while they are
// being evaluated (AuthModule reads JWT_SECRET, PrismaService reads
// DATABASE_URL), so the .env file has to be in place before any of them load.
import "./common/load-env";

import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: process.env.APP_URL, credentials: true });
  await app.listen(4000);
}
bootstrap();
