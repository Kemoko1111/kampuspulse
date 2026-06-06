export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  textFields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of textFields) {
    if (typeof result[field] === "string") {
      (result[field] as string) = sanitizeText(result[field] as string);
    }
  }
  return result;
}
