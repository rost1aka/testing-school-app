import { Injectable } from "@nestjs/common";
import { Address, Prisma, Role, User } from "@prisma/client";
import { AddressInput, UpdateProfileInput } from "@school/shared";
import { AppError } from "../common/error-response";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Prisma raises P2025 ("an operation failed because it depends on one or more
 * records that were required but not found") when the row a write targets has
 * disappeared. For an address write that can only mean the row was deleted
 * between the ownership check in `updateAddress`/`deleteAddress` and the write
 * that follows it — a concurrent delete by the same user. The caller lost that
 * race, so the address is no
 * longer theirs to modify: answer exactly as the ownership check would,
 * rather than leaking a 500 INTERNAL_ERROR for an ordinary interleaving.
 */
function toAddressOwnershipError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return new AppError("FORBIDDEN", "You may only modify your own addresses", 403);
  }
  return error;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds the public profile shape field-by-field rather than spreading the
   * Prisma `User` and deleting `passwordHash` — that way the hash cannot leak
   * back in when the model grows a field, since only the fields listed here
   * are ever copied onto the response.
   */
  toProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.findUserOrThrow(userId);
    return this.toProfile(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: input,
    });
    return this.toProfile(user);
  }

  listAddresses(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({ where: { userId }, orderBy: { id: "asc" } });
  }

  createAddress(userId: string, input: AddressInput): Promise<Address> {
    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.address.count({ where: { userId } });
      const isDefault = input.isDefault ?? existingCount === 0;

      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: input.label,
          line1: input.line1,
          city: input.city,
          postalCode: input.postalCode,
          country: input.country,
          isDefault,
        },
      });
    });
  }

  updateAddress(userId: string, addressId: string, input: Partial<AddressInput>): Promise<Address> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findUnique({ where: { id: addressId } });
      if (!existing || existing.userId !== userId) {
        throw new AppError("FORBIDDEN", "You may only modify your own addresses", 403);
      }

      if (input.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      try {
        return await tx.address.update({ where: { id: addressId }, data: input });
      } catch (error) {
        throw toAddressOwnershipError(error);
      }
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const existing = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      throw new AppError("FORBIDDEN", "You may only modify your own addresses", 403);
    }

    try {
      await this.prisma.address.delete({ where: { id: addressId } });
    } catch (error) {
      throw toAddressOwnershipError(error);
    }
  }

  private async findUserOrThrow(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found", 404);
    }
    return user;
  }
}
