// Must come first: modules imported below read process.env while they are
// being evaluated (AuthModule reads JWT_SECRET, PrismaService reads
// DATABASE_URL), so the .env file has to be in place before any of them load.
import "./common/load-env";

import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { resolvePort } from "./common/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: process.env.APP_URL, credentials: true });
  // Bind every interface rather than loopback alone: on a hosting platform
  // the router and the health check reach this process from outside its
  // container, and a loopback-only listener is invisible to both.
  await app.listen(resolvePort(process.env), "0.0.0.0");
}
bootstrap();
