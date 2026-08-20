import { PipeTransform } from "@nestjs/common";
import { toFieldErrors } from "@school/shared";
import { ZodSchema } from "zod";
import { AppError } from "./error-response";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    // Shared with the browser, so a locally-caught failure and a 400 produce
    // the same fieldErrors for the same draft.
    throw new AppError(
      "VALIDATION_FAILED",
      "Check the highlighted fields",
      400,
      toFieldErrors(result.error),
    );
  }
}
