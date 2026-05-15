import { describe, it, expect } from "vitest";
import { chordProToSCS } from "../src/import/chordPro.ts";
import { parseSection } from "../src/parser/parseSection";

it("produces valid SCS that can be parsed", () => {
  const input = "[G]Amazing [C]grace [D]how sweet";
  const scs = chordProToSCS(input, "G");
  const parsed = parseSection(scs);

  expect(parsed.length).toBeGreaterThan(0);
});

it("handles complex imported chords through full pipeline", () => {
  const input = "[Cmaj7/E]Hello [F#dim]world";
  const scs = chordProToSCS(input, "C");
  const parsed = parseSection(scs);

  expect(parsed.length).toBeGreaterThan(0);
});

describe("ChordPro importer", () => {
  it("converts basic major chords", () => {
    const input = "[G]Amazing [C]grace [D]how sweet";
    const output = chordProToSCS(input, "G");

    expect(output).toBe("[1]Amazing [4]grace [5]how sweet");
  });

  it("handles minor chords", () => {
    const input = "[Em]hello [C]world";
    const output = chordProToSCS(input, "G");

    // [6] in G major already implies minor (vi); the explicit `m` is redundant.
    expect(output).toBe("[6]hello [4]world");
  });

  it("handles accidentals", () => {
    // F# in G major is a major triad on the 7th degree — but the diatonic vii is
    // diminished, so the major quality must be made explicit (`[7M]`).  Bb is the
    // borrowed b3; accidental degrees default to M, so no quality char is needed.
    const input = "[F#]test [Bb]case";
    const output = chordProToSCS(input, "G");

    expect(output).toBe("[7M]test [b3]case");
  });

  it("omits redundant quality on diatonic chords", () => {
    const input = "[G]a [Am]b [Bm]c [C]d [D]e [Em]f [F#dim]g";
    const output = chordProToSCS(input, "G");

    expect(output).toBe("[1]a [2]b [3]c [4]d [5]e [6]f [7]g");
  });

  it("emits explicit quality for borrowed chords", () => {
    // Major chord on degree 2 (would be ii minor by default) → [2M]
    // Minor chord on degree 5 (would be V major by default)  → [5m]
    const input = "[A]a [Dm]b";
    const output = chordProToSCS(input, "G");

    expect(output).toBe("[2M]a [5m]b");
  });

  it("omits redundant quality in minor mode", () => {
    const input = "[Am]a [Bdim]b [C]c [Dm]d [Em]e [F]f [G]g";
    const output = chordProToSCS(input, "A", "minor");

    expect(output).toBe("[1]a [2]b [3]c [4]d [5]e [6]f [7]g");
  });

  it("preserves lyrics without chords", () => {
    const input = "Amazing grace how sweet the sound";
    const output = chordProToSCS(input, "G");

    expect(output).toBe(input);
  });

  it("handles multiple lines", () => {
    const input = "[G]Line one\n[C]Line two";
    const output = chordProToSCS(input, "G");

    expect(output).toBe("[1]Line one\n[4]Line two");
  });

  it("handles slash chords", () => {
    const input = "[G/B]hello [C/E]world";
    const output = chordProToSCS(input, "G");

    expect(output).toBe("[1/3]hello [4/6]world");
  });

  it("handles slash chords with modifiers", () => {
    const input = "[Cmaj7/E]test";
    const output = chordProToSCS(input, "G");

    expect(output).toBe("[4maj7/6]test");
  });
});
