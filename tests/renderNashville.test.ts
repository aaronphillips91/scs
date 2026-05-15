import { describe, it, expect } from "vitest";
import { parseSong } from "../src/parser/parseSong";
import {
  renderChordNashville,
  renderSectionAsNashville,
  renderSongAsNashville,
} from "../src/renderer/renderNashville";
import { parseChord } from "../src/parser/parseChord";

describe("renderChordNashville", () => {
  it("leaves major-key songs essentially unchanged", () => {
    expect(renderChordNashville(parseChord("1"), "G", "major")).toBe("1");
    expect(renderChordNashville(parseChord("6"), "G", "major")).toBe("6");
    expect(renderChordNashville(parseChord("4"), "G", "major")).toBe("4");
  });

  it("rewrites minor-mode bare diatonic degrees into major-scale-relative form", () => {
    // Storage in Am uses bare numbers for natural-minor diatonic chords:
    // [1]=Am, [3]=C, [4]=Dm, [5]=Em, [6]=F, [7]=G.
    // Nashville-session style names them relative to A *major* scale.
    expect(renderChordNashville(parseChord("1"), "A", "minor")).toBe("1m");
    expect(renderChordNashville(parseChord("3"), "A", "minor")).toBe("b3");
    expect(renderChordNashville(parseChord("4"), "A", "minor")).toBe("4m");
    expect(renderChordNashville(parseChord("5"), "A", "minor")).toBe("5m");
    expect(renderChordNashville(parseChord("6"), "A", "minor")).toBe("b6");
    expect(renderChordNashville(parseChord("7"), "A", "minor")).toBe("b7");
  });

  it("renders the harmonic V in minor (E major in Am) as bare 5", () => {
    // In Nashville style, [5] already implies the major V; the minor v is [5m].
    expect(renderChordNashville(parseChord("5M"), "A", "minor")).toBe("5");
    expect(renderChordNashville(parseChord("5"), "A", "minor")).toBe("5m");
  });
});

describe("renderSectionAsNashville", () => {
  it("renders an Am section in Nashville style", () => {
    const out = renderSectionAsNashville("[1]hello [3]world", "A", "minor");
    expect(out).toContain("1m");
    expect(out).toContain("b3");
  });
});

describe("renderSongAsNashville", () => {
  it("converts a stored Am song to Nashville session notation", () => {
    const song = parseSong(
      "{key: Am}\n[Am]hello [C]world [F]today [G]friend",
      "A",
      "minor",
    );
    const out = renderSongAsNashville(song);
    expect(out).toContain("1m");
    expect(out).toContain("b3");
    expect(out).toContain("b6");
    expect(out).toContain("b7");
  });

  it("leaves a G-major song's Nashville rendering matching its native NNS", () => {
    const song = parseSong("{key: G}\n[G]a [Em]b [C]c [D]d", "G");
    const out = renderSongAsNashville(song);
    expect(out).toContain("1");
    expect(out).toContain("6");
    expect(out).toContain("4");
    expect(out).toContain("5");
    expect(out).not.toContain("6m"); // mode-default minor stays implicit
  });
});
