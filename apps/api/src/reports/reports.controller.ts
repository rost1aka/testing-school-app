import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { uapReportSchema, UapReportValues } from "@school/shared";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ReportsService, UapReportSummary, UapReportView } from "./reports.service";

// Every route is an agent reading or writing their own reports, so the guard
// sits on the controller rather than on each handler.
@Controller("reports/uap")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(uapReportSchema)) body: UapReportValues,
  ): Promise<UapReportView> {
    return this.reportsService.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: CurrentUserPayload): Promise<UapReportSummary[]> {
    return this.reportsService.list(user.id);
  }

  @Get(":id")
  get(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ): Promise<UapReportView> {
    return this.reportsService.get(user.id, id);
  }

  // The same schema as filing: an amendment has to satisfy every rule a first
  // filing does, so a report can never be edited into a state it could not
  // have been filed in.
  @Patch(":id")
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(uapReportSchema)) body: UapReportValues,
  ): Promise<UapReportView> {
    return this.reportsService.update(user.id, id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ): Promise<void> {
    await this.reportsService.remove(user.id, id);
  }
}
