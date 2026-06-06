import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.length ? issue.path.join(".") : "input";
      return `${field}: ${issue.message}`;
    })
    .join("; ");
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: formatZodError(error), code: "VALIDATION_ERROR", details: error.issues },
      { status: 400 }
    );
  }
  console.error("Unhandled error:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
