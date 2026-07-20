import { describe, it, expect } from "vitest";
import { buildSearchOrFilter } from "@/lib/repositories/postgrest-filter";

describe("buildSearchOrFilter", () => {
  it("builds a plain ilike-or filter for normal input", () => {
    expect(buildSearchOrFilter(["title", "description"], "phone")).toBe(
      'title.ilike."%phone%",description.ilike."%phone%"'
    );
  });

  it("keeps a comma-and-operator injection attempt inside the quoted value", () => {
    const result = buildSearchOrFilter(["title", "description"], 'x",id.neq.1');
    // The whole malicious payload must stay inside one quoted value per column,
    // never producing a bare unescaped `"` that would close the value early.
    expect(result).toBe(
      'title.ilike."%x\\",id.neq.1%",description.ilike."%x\\",id.neq.1%"'
    );
    expect(result.match(/(?<!\\)"/g)?.length).toBe(4); // 2 unescaped quote-pairs (one per column)
  });

  it("escapes embedded backslashes and quotes", () => {
    const result = buildSearchOrFilter(["title"], 'back\\slash "quote"');
    expect(result).toBe('title.ilike."%back\\\\slash \\"quote\\"%"');
  });
});
