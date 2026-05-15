import { describe, it, expect } from "vitest";
import { parseSong } from "../src/parser/parseSong";
import { renderSection } from "../src/renderer/renderSection";
import { renderSong } from "../src/renderer/renderSong";

describe("renderSection NNS mode — chord display", () => {
  it("renders diatonic major degrees without quality suffix", () => {
    const content = "[1]Amazing [4]grace [5]how";
    const out = renderSection(content, "G", "major", true);
    expect(out).toContain("1");
    expect(out).toContain("4");
    expect(out).toContain("5");
    expect(out).not.toMatch(/1m|4m|5m/);
  });

  it("preserves bare degrees without expanding implied quality", () => {
    // [2], [3], [6] in major already imply minor (ii, iii, vi).  NNS display
    // keeps them bare rather than expanding to [2m] / [3m] / [6m].
    const content = "[2]word [3]word [6]word";
    const out = renderSection(content, "G", "major", true);
    expect(out).toMatch(/(^|\s)2(\s|$)/m);
    expect(out).toMatch(/(^|\s)3(\s|$)/m);
    expect(out).toMatch(/(^|\s)6(\s|$)/m);
    expect(out).not.toMatch(/2m|3m|6m/);
  });

  it("preserves bare 7 without expanding to 7°", () => {
    const out = renderSection("[7]word", "G", "major", true);
    expect(out).toMatch(/(^|\s)7(\s|$)/m);
    expect(out).not.toContain("7°");
  });

  it("renders borrowed chord with explicit quality", () => {
    const out = renderSection("[4m]word", "G", "major", true);
    expect(out).toContain("4m");
  });

  it("renders harmonic V in minor as major", () => {
    const out = renderSection("[5M]word", "A", "minor", true);
    expect(out).toContain("5M");
    expect(out).not.toContain("5m");
  });

  it("positions chords above lyrics", () => {
    const out = renderSection("[1]Amazing [4]grace", "G", "major", true);
    const [chordLine, lyricLine] = out.split("\n");
    expect(chordLine).toMatch(/1/);
    expect(chordLine).toMatch(/4/);
    expect(lyricLine).toContain("Amazing");
    expect(lyricLine).toContain("grace");
  });
});

describe("renderSong NNS mode", () => {
  it("includes section headers", () => {
    const song = parseSong("{comment: Verse}\n[G]Amazing [C]grace", "G");
    expect(renderSong(song, undefined, undefined, true)).toContain("[Verse]");
  });

  it("renders all sections with NNS chords", () => {
    const song = parseSong(
      "{comment: Verse}\n[G]Amazing\n{comment: Chorus}\n[C]Praise",
      "G",
    );
    const out = renderSong(song, undefined, undefined, true);
    expect(out).toContain("1");
    expect(out).toContain("4");
    expect(out).toContain("Amazing");
    expect(out).toContain("Praise");
  });
});
