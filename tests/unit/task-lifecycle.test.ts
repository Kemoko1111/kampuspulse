import { describe, it, expect } from "vitest";

const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled", "disputed"],
  completed: [],
  cancelled: [],
  disputed: ["completed", "cancelled"],
};

function canTransition(from: string, to: string): boolean {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

describe("Task lifecycle", () => {
  it("allows open to assigned", () => {
    expect(canTransition("open", "assigned")).toBe(true);
  });

  it("blocks open to completed", () => {
    expect(canTransition("open", "completed")).toBe(false);
  });

  it("allows in_progress to completed", () => {
    expect(canTransition("in_progress", "completed")).toBe(true);
  });
});
