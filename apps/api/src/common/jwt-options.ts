import { JwtModuleOptions } from "@nestjs/jwt";

/**
 * The signing options every module that issues or reads an access token
 * registers `JwtModule` with.
 *
 * This is a factory rather than a constant because it reads `process.env`:
 * evaluated at import time, correctness would depend on whether apps/api/.env
 * happened to be loaded by some earlier import. Called when a module is
 * instantiated, main.ts (or the integration suite's global setup) has
 * definitely loaded it by then.
 */
export function jwtOptions(): JwtModuleOptions {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Without this, JwtModule signs with `undefined`, which jsonwebtoken
    // accepts: the app boots, issues tokens nobody can verify, and fails much
    // later with an unrelated-looking 401.
    throw new Error(
      "JWT_SECRET is not set. Copy apps/api/.env.example to apps/api/.env, or set JWT_SECRET in the environment.",
    );
  }
  return { secret, signOptions: { expiresIn: "15m" } };
}
