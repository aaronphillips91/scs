import { describe, it, expect } from "vitest";
import { parseSection } from "../src/parser/parseSection";
import { renderLine } from "../src/renderer/renderLine";

it("renders chords aligned above lyrics", () => {
  const input = "[1]Amazing [4]grace how [5]sweet";
  const segments = parseSection(input)[0].segments;
  const output = renderLine(segments, "G", "major");

  expect(output).toContain("G");

  expect(output).toContain("Amazing");
});
