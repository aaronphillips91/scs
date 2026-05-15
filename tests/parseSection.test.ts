import { describe, it, expect } from "vitest";
import { parseSection } from "../src/parser/parseSection";

describe("parseSection", () => {
  it("parses simple line", () => {
    const lines = parseSection("[1]Amazing [4]grace");

    expect(lines.length).toBe(1);

    const segments = lines[0].segments;

    expect(segments[0].chord?.degree).toBe(1);
    expect(segments[0].text).toBe("Amazing ");

    expect(segments[1].chord?.degree).toBe(4);
    expect(segments[1].text).toBe("grace");
  });

  it("handles text without chords", () => {
    const lines = parseSection("Amazing grace");

    expect(lines[0].segments[0].text).toBe("Amazing grace");
  });

  it("handles multiple lines", () => {
    const lines = parseSection("[1]Line one\n[4]Line two");

    expect(lines.length).toBe(2);
    expect(lines[0].segments[0].chord?.degree).toBe(1);
    expect(lines[1].segments[0].chord?.degree).toBe(4);
  });
});
