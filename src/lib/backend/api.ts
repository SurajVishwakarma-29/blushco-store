import { NextResponse } from "next/server";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function parseJsonBody<T>(value: unknown): T {
  return value as T;
}

export function fail(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.status },
    );
  }

  const devMessage = error instanceof Error ? error.message : null;

  console.error("Unhandled API error", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development" && devMessage
            ? devMessage
            : "Something went wrong on the server.",
      },
    },
    { status: 500 },
  );
}
