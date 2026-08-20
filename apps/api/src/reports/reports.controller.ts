import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
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
}
