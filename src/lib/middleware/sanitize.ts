import sanitizeHtml from "sanitize-html";

// Regex tag-stripping is well known to be bypassable — malformed/nested
// tags, encoded attributes, or event handlers split across whitespace can
// all slip past a hand-rolled pattern. sanitize-html actually parses the
// markup (via htmlparser2) rather than pattern-matching it, so it isn't
// fooled by input shaped to defeat a regex. Every caller of this treats the
// result as plain text, so the allowlist stays empty — strip all tags and
// attributes, keep only text content.
export function sanitizeText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();
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
