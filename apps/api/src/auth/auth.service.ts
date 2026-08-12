import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Role } from "@prisma/client";
import { LoginInput, RegisterInput } from "@school/shared";
import { computeExpiry, generateToken, hashToken } from "../common/token.util";
import { hashPassword, verifyPassword } from "../common/crypto.util";
import { AppError } from "../common/error-response";
import { PrismaService } from "../prisma/prisma.service";

// Has no corresponding plaintext; only used so a lookup miss takes about as
// long as a real password check.
const DUMMY_PASSWORD_HASH = "$2b$10$wx8cn89V6DnzudWonhTMVe.q6he1G7vB3EmF7x18LyrsafFsfL5Ma";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<{ id: string } & TokenPair> {
    const passwordHash = await hashPassword(input.password);
    const id = `usr_${randomUUID()}`;

    try {
      const user = await this.prisma.user.create({
        data: {
          id,
          email: input.email,
          passwordHash,
          name: input.name,
          role: Role.USER,
          createdAt: new Date(),
        },
      });

      const tokens = await this.issueTokens(user.id, user.role);
      return { id: user.id, ...tokens };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("EMAIL_TAKEN", "That email is already registered", 409);
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (!user) {
      await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
      throw new AppError("INVALID_CREDENTIALS", "Email or password is incorrect", 401);
    }

    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError("INVALID_CREDENTIALS", "Email or password is incorrect", 401);
    }

    const tokens = await this.issueTokens(user.id, user.role);
    return { ...tokens, userId: user.id };
  }

  private async issueTokens(userId: string, role: Role): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync({ sub: userId, role });

    const refreshToken = generateToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: computeExpiry(60 * 24 * 30),
      },
    });

    return { accessToken, refreshToken };
  }
}
