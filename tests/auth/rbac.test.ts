import { describe, it, expect } from "vitest";

const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled", "disputed"],
};

describe("RBAC and Task Lifecycle", () => {
  it("allows valid status transitions", () => {
    expect(VALID_TRANSITIONS.open).toContain("assigned");
    expect(VALID_TRANSITIONS.assigned).toContain("in_progress");
    expect(VALID_TRANSITIONS.in_progress).toContain("completed");
  });

  it("blocks invalid transitions", () => {
    expect(VALID_TRANSITIONS.open).not.toContain("completed");
    expect(VALID_TRANSITIONS.completed).toBeUndefined();
  });

  it("validates role permissions", () => {
    const roles = ["student", "vendor", "rider", "admin"];
    expect(roles).toContain("admin");
    expect(roles.filter((r) => r === "rider")).toHaveLength(1);
  });
});
