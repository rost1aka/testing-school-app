import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Address } from "@prisma/client";
import { addressInputSchema, AddressInput, updateProfileSchema, UpdateProfileInput } from "@school/shared";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { UserProfile, UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: CurrentUserPayload): Promise<UserProfile> {
    return this.usersService.getProfile(user.id);
  }

  @Patch("me")
  updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<UserProfile> {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get("me/addresses")
  listAddresses(@CurrentUser() user: CurrentUserPayload): Promise<Address[]> {
    return this.usersService.listAddresses(user.id);
  }

  @Post("me/addresses")
  @HttpCode(201)
  createAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(addressInputSchema)) body: AddressInput,
  ): Promise<Address> {
    return this.usersService.createAddress(user.id, body);
  }

  @Patch("me/addresses/:id")
  updateAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addressInputSchema.partial())) body: Partial<AddressInput>,
  ): Promise<Address> {
    return this.usersService.updateAddress(user.id, id, body);
  }

  @Delete("me/addresses/:id")
  @HttpCode(204)
  async deleteAddress(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string): Promise<void> {
    await this.usersService.deleteAddress(user.id, id);
  }

  @Get(":id")
  getById(@Param("id") id: string): Promise<UserProfile> {
    return this.usersService.getProfile(id);
  }
}
