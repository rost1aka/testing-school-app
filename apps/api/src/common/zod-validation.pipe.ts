import { PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";
import { AppError, FieldErrors } from "./error-response";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    throw new AppError("VALIDATION_FAILED", "Check the highlighted fields", 400, fieldErrors);
  }
}
