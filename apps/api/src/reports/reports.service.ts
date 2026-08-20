import { Injectable } from "@nestjs/common";
import { Prisma, UapReport } from "@prisma/client";
import { UapReportValues } from "@school/shared";
import { AppError } from "../common/error-response";
import { PrismaService } from "../prisma/prisma.service";

/** A filed report, in the same shape the form submitted. */
export interface UapReportView extends UapReportValues {
  id: string;
  createdAt: string;
  amendedAt: string | null;
}

/** What the list page needs, and no more. */
export interface UapReportSummary {
  id: string;
  caseNumber: string;
  sightingDate: string;
  objectShape: string;
  threatAssessment: string;
}

// The two date columns are `@db.Date`: no time, no zone. Round-tripping them
// through the same YYYY-MM-DD string the form uses keeps the browser from ever
// seeing a timestamp it would have to reformat — and from shifting the date by
// a day when the viewer sits west of UTC.
const toDay = (value: string) => new Date(`${value}T00:00:00.000Z`);
const fromDay = (value: Date) => value.toISOString().slice(0, 10);

function toView(report: UapReport): UapReportView {
  return {
    id: report.id,
    caseNumber: report.caseNumber,
    reportingAgentName: report.reportingAgentName,
    badgeNumber: report.badgeNumber,
    fieldOffice: report.fieldOffice,
    sightingDate: fromDay(report.sightingDate),
    reportFiledDate: fromDay(report.reportFiledDate),
    sightingLocation: report.sightingLocation,
    objectShape: report.objectShape,
    objectShapeOther: report.objectShapeOther,
    objectCount: report.objectCount,
    observationDuration: report.observationDuration,
    estimatedAltitude: report.estimatedAltitude,
    narrative: report.narrative,
    evidenceCollected: report.evidenceCollected,
    debrisCustodyChain: report.debrisCustodyChain,
    debrisStorageLocation: report.debrisStorageLocation,
    mediaReferenceIds: report.mediaReferenceIds,
    civilianWitnesses: report.civilianWitnesses,
    witnessCount: report.witnessCount,
    witnessStatement: report.witnessStatement,
    encounterClass: report.encounterClass,
    physicalEffects: report.physicalEffects,
    occupantDescription: report.occupantDescription,
    missingTimeMinutes: report.missingTimeMinutes,
    medicalEvaluation: report.medicalEvaluation,
    threatAssessment: report.threatAssessment,
    escalationJustification: report.escalationJustification,
    classificationLevel: report.classificationLevel,
    notifyBureauLeadership: report.notifyBureauLeadership,
    additionalRemarks: report.additionalRemarks,
    certified: report.certified,
    createdAt: report.createdAt.toISOString(),
    amendedAt: report.amendedAt ? report.amendedAt.toISOString() : null,
  };
}

function toWriteError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new AppError("CASE_NUMBER_TAKEN", "Check the highlighted fields", 409, {
        caseNumber: ["That case number is already on file."],
      });
    }
    // The row went away between the ownership check and the write — a
    // concurrent delete by the same agent. It is gone, not forbidden.
    if (error.code === "P2025") {
      return new AppError("NOT_FOUND", "No such report", 404);
    }
  }
  return error;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Uniqueness is enforced by catching the constraint violation rather than by
   * reading first and then writing: two agents filing the same case number at
   * the same moment would both pass a read-then-write check.
   */
  async create(userId: string, input: UapReportValues): Promise<UapReportView> {
    try {
      const report = await this.prisma.uapReport.create({
        data: {
          ...input,
          userId,
          sightingDate: toDay(input.sightingDate),
          reportFiledDate: toDay(input.reportFiledDate),
        },
      });
      return toView(report);
    } catch (error) {
      throw toWriteError(error);
    }
  }

  /**
   * A full replacement rather than a partial patch: the form loads the whole
   * report, so it sends the whole report back, and one schema validates a
   * saved amendment exactly as it validates a first filing.
   */
  async update(userId: string, id: string, input: UapReportValues): Promise<UapReportView> {
    await this.get(userId, id);
    try {
      const report = await this.prisma.uapReport.update({
        where: { id },
        data: {
          ...input,
          sightingDate: toDay(input.sightingDate),
          reportFiledDate: toDay(input.reportFiledDate),
          amendedAt: new Date(),
        },
      });
      return toView(report);
    } catch (error) {
      throw toWriteError(error);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    try {
      await this.prisma.uapReport.delete({ where: { id } });
    } catch (error) {
      throw toWriteError(error);
    }
  }

  async list(userId: string): Promise<UapReportSummary[]> {
    const reports = await this.prisma.uapReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        caseNumber: true,
        sightingDate: true,
        objectShape: true,
        threatAssessment: true,
      },
    });
    return reports.map((report) => ({
      ...report,
      sightingDate: fromDay(report.sightingDate),
    }));
  }

  async get(userId: string, id: string): Promise<UapReportView> {
    const report = await this.prisma.uapReport.findUnique({ where: { id } });
    if (!report) {
      throw new AppError("NOT_FOUND", "No such report", 404);
    }
    // 403 rather than 404 for someone else's report, matching USER-02: this
    // application already chose to say "not yours" rather than "not there".
    if (report.userId !== userId) {
      throw new AppError("FORBIDDEN", "You may only read your own reports", 403);
    }
    return toView(report);
  }
}
