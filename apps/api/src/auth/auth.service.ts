import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Role } from "@prisma/client";
import { LoginInput, RegisterInput } from "@school/shared";
import { MailService } from "../mail/mail.service";
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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

  async refresh(presentedToken: string): Promise<TokenPair> {
    const tokenHash = hashToken(presentedToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new AppError("INVALID_SESSION", "Please sign in again", 401);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });

      return this.issueTokens(existing.userId, existing.user.role, tx);
    });
  }

  async logout(presentedToken: string): Promise<void> {
    const tokenHash = hashToken(presentedToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = generateToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: computeExpiry(15),
      },
    });

    // Deliberately not awaited: the SMTP round-trip (fresh connection, full
    // EHLO/MAIL/RCPT/DATA/QUIT) takes far longer than the unknown-address
    // path above, which returns after a single indexed lookup. Awaiting it
    // here would let an attacker time this endpoint to tell known addresses
    // apart from unknown ones. The token row is already committed by the
    // time we respond, so callers can poll for the email; a delivery
    // failure is logged rather than surfaced to the caller.
    this.mailService.sendPasswordReset(user.email, token).catch((error) => {
      this.logger.error("Failed to send password reset email", error);
    });
  }

  async resetPassword(presentedToken: string, password: string): Promise<void> {
    const tokenHash = hashToken(presentedToken);
    const existing = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!existing || existing.usedAt || existing.expiresAt < new Date()) {
      throw new AppError("INVALID_TOKEN", "This reset link is no longer valid", 400);
    }

    const passwordHash = await hashPassword(password);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: existing.id },
        data: { usedAt: new Date() },
      });

      await tx.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  private async issueTokens(
    userId: string,
    role: Role,
    prisma: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync({ sub: userId, role });

    const refreshToken = generateToken();
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: computeExpiry(60 * 24 * 30),
      },
    });

    return { accessToken, refreshToken };
  }
}
