import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("demo seed", () => {
  afterAll(() => prisma.$disconnect());

  it("creates exactly three accounts with fixed ids", async () => {
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    expect(users.map((u) => u.id)).toEqual(["usr_admin", "usr_dana", "usr_student"]);
  });

  it("gives admin the ADMIN role and the others USER", async () => {
    const roles = Object.fromEntries(
      (await prisma.user.findMany()).map((u) => [u.id, u.role]),
    );
    expect(roles).toEqual({ usr_admin: "ADMIN", usr_dana: "USER", usr_student: "USER" });
  });

  it("gives Dana two addresses, exactly one of them default", async () => {
    const addresses = await prisma.address.findMany({ where: { userId: "usr_dana" } });
    expect(addresses).toHaveLength(2);
    expect(addresses.filter((a) => a.isDefault)).toHaveLength(1);
  });
});
