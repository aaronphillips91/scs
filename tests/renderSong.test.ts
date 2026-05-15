import { describe, it, expect } from "vitest";
import { parseSong } from "../src/parser/parseSong";
import { renderSong } from "../src/renderer/renderSong";

const SIMPLE = [
  "{title: Test Song}",
  "{comment: Verse}",
  "[G]Amazing [C]grace [D]how sweet",
  "{comment: Chorus}",
  "[C]Praise [G]God",
].join("\n");

describe("renderSong — structure", () => {
  it("includes section labels as headers", () => {
    const song = parseSong(SIMPLE, "G");
    const out = renderSong(song);
    expect(out).toContain("[Verse]");
    expect(out).toContain("[Chorus]");
  });

  it("omits header for unlabeled sections", () => {
    const song = parseSong("[G]no label", "G");
    const out = renderSong(song);
    expect(out).not.toMatch(/^\[.*\]/m);
  });

  it("renders chord names above lyrics", () => {
    const song = parseSong("{comment: V}\n[G]Amazing [C]grace", "G");
    const out = renderSong(song);
    expect(out).toContain("G");
    expect(out).toContain("C");
    expect(out).toContain("Amazing");
    expect(out).toContain("grace");
  });

  it("renders all sections", () => {
    const song = parseSong(SIMPLE, "G");
    const out = renderSong(song);
    expect(out).toContain("Amazing");
    expect(out).toContain("Praise");
  });
});

describe("renderSong — key and mode", () => {
  it("defaults to song tonal context", () => {
    const song = parseSong("{comment: V}\n[G]Amazing [C]grace", "G");
    const out = renderSong(song);
    expect(out).toContain("G");
    expect(out).toContain("C");
  });

  it("can render in a different key", () => {
    const song = parseSong("{comment: V}\n[G]Amazing", "G");
    // G = degree 1; in D major, degree 1 = D
    expect(renderSong(song, "D")).toContain("D");
  });

  it("can render the same song in multiple keys", () => {
    const song = parseSong("{comment: V}\n[G]test", "G");
    const inC = renderSong(song, "C");
    const inA = renderSong(song, "A");
    expect(inC).toContain("C");
    expect(inA).toContain("A");
  });

  it("renders minor mode correctly", () => {
    // E major → store in minor mode → degree 1 renders as Em
    const song = parseSong("{comment: V}\n[E]root", "E", "major", "minor");
    const out = renderSong(song);
    expect(out).toContain("Em");
  });
});
