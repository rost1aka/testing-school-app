import type { FieldErrors } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: FieldErrors | null,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const envelope = (body ?? {}) as { code?: string; message?: string; fieldErrors?: FieldErrors | null };
    throw new ApiError(
      response.status,
      envelope.code ?? "UNKNOWN",
      envelope.message ?? "Something went wrong",
      envelope.fieldErrors ?? null,
    );
  }

  return body as T;
}
