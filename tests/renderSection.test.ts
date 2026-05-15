import { describe, it, expect } from "vitest";
import { renderSection } from "../src/renderer/renderSection";

describe("renderSection", () => {
  it("renders multiple lines", () => {
    const input = "[1]Amazing\n[4]grace";

    const output = renderSection(input, "G", "major");

    expect(output).toContain("G");
    expect(output).toContain("C");
    expect(output.split("\n").length).toBeGreaterThan(2);
  });
});
