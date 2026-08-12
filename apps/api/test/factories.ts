import { randomUUID } from "node:crypto";
import request from "supertest";
import { Role, User } from "@prisma/client";
import { hashPassword } from "../src/common/crypto.util";
import { PrismaService } from "../src/prisma/prisma.service";
import { TestApp } from "./setup";

const DEFAULT_CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

export async function createUser(
  prisma: PrismaService,
  overrides: { id?: string; email?: string; password?: string; name?: string; role?: Role } = {},
): Promise<User> {
  const password = overrides.password ?? "Password123!";

  return prisma.user.create({
    data: {
      id: overrides.id ?? `usr_${randomUUID()}`,
      email: overrides.email ?? "test@example.com",
      passwordHash: await hashPassword(password),
      name: overrides.name ?? "Test User",
      role: overrides.role ?? Role.USER,
      createdAt: DEFAULT_CREATED_AT,
    },
  });
}

export async function loginAs(
  app: TestApp,
  email: string,
  password: string,
): Promise<{ cookies: string[] }> {
  const res = await request(app.server).post("/auth/login").send({ email, password }).expect(200);
  return { cookies: (res.get("set-cookie") ?? []) as unknown as string[] };
}
