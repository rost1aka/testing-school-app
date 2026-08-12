export type FieldErrors = Record<string, string[]>;

export interface ErrorBody {
  code: string;
  message: string;
  fieldErrors: FieldErrors | null;
}

export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly fieldErrors: FieldErrors | null = null,
  ) {
    super(message);
  }
}
