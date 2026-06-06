import { describe, it, expect } from "vitest";
import { AppError } from "@/lib/errors/app-error";

describe("AppError", () => {
  it("creates error with status code", () => {
    const error = new AppError("Not found", 404, "NOT_FOUND");
    expect(error.message).toBe("Not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });
});
