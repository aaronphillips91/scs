import { describe, it, expect } from "vitest";
import { parseChord } from "../src/parser/parseChord";
import { renderChord } from "../src/renderer/renderChord";

describe("renderChord (major key)", () => {
  it("renders basic degrees in G", () => {
    expect(renderChord(parseChord("1"), "G", "major")).toBe("G");
    expect(renderChord(parseChord("4"), "G", "major")).toBe("C");
    expect(renderChord(parseChord("5"), "G", "major")).toBe("D");
  });

  it("renders all degrees in C (sanity)", () => {
    expect(renderChord(parseChord("1"), "C", "major")).toBe("C");
    expect(renderChord(parseChord("2"), "C", "major")).toBe("Dm");
    expect(renderChord(parseChord("3"), "C", "major")).toBe("Em");
    expect(renderChord(parseChord("4"), "C", "major")).toBe("F");
    expect(renderChord(parseChord("5"), "C", "major")).toBe("G");
    expect(renderChord(parseChord("6"), "C", "major")).toBe("Am");
    expect(renderChord(parseChord("7"), "C", "major")).toBe("Bdim");
  });
});

describe("renderChord (quality)", () => {
  it("renders minor chords", () => {
    expect(renderChord(parseChord("6m"), "G", "major")).toBe("Em");
    expect(renderChord(parseChord("2m"), "C", "major")).toBe("Dm");
  });

  it("renders diminished and augmented", () => {
    expect(renderChord(parseChord("7°"), "C", "major")).toBe("Bdim");
    expect(renderChord(parseChord("3+"), "C", "major")).toBe("Eaug");
  });
});

describe("renderChord (modifiers)", () => {
  it("renders common modifiers", () => {
    expect(renderChord(parseChord("5sus4"), "C", "major")).toBe("Gsus4");
    expect(renderChord(parseChord("1add9"), "C", "major")).toBe("Cadd9");
    expect(renderChord(parseChord("1maj7"), "C", "major")).toBe("Cmaj7");
  });

  it("renders multiple modifiers", () => {
    expect(renderChord(parseChord("1maj713"), "C", "major")).toBe("Cmaj713");
  });
});

describe("renderChord (accidentals)", () => {
  it("renders sharp degrees", () => {
    expect(renderChord(parseChord("#1"), "C", "major")).toBe("C#");
    expect(renderChord(parseChord("#4"), "C", "major")).toBe("F#");
  });

  it("renders flat degrees", () => {
    expect(renderChord(parseChord("b7"), "C", "major")).toBe("Bb");
    expect(renderChord(parseChord("b3"), "C", "major")).toBe("Eb");
  });
});

describe("renderChord (bass / slash chords)", () => {
  it("renders slash chords", () => {
    expect(renderChord(parseChord("1/3"), "C", "major")).toBe("C/E");
    expect(renderChord(parseChord("5/7"), "C", "major")).toBe("G/B");
  });

  it("renders accidental bass", () => {
    expect(renderChord(parseChord("1/b3"), "C", "major")).toBe("C/D#"); // current limitation
  });
});

describe("renderChord (different keys)", () => {
  it("renders correctly in different keys", () => {
    expect(renderChord(parseChord("1"), "D", "major")).toBe("D");
    expect(renderChord(parseChord("4"), "D", "major")).toBe("G");
    expect(renderChord(parseChord("5"), "D", "major")).toBe("A");
  });

  it("translates same degree across keys", () => {
    const chord = parseChord("1");

    expect(renderChord(chord, "C", "major")).toBe("C");
    expect(renderChord(chord, "G", "major")).toBe("G");
    expect(renderChord(chord, "A", "major")).toBe("A");
  });

  it("uses flats for flat keys (scale generation)", () => {
    // In key of F, the 4 chord should be Bb (not A#)
    expect(renderChord(parseChord("4"), "F", "major")).toBe("Bb");
  });

  it("renders flat accidentals correctly", () => {
    expect(renderChord(parseChord("b7"), "C", "major")).toBe("Bb");
  });
});

describe("renderChord (minor mode)", () => {
  it("renders natural minor scale correctly", () => {
    expect(renderChord(parseChord("1"), "A", "minor")).toBe("Am");
    expect(renderChord(parseChord("2"), "A", "minor")).toBe("Bdim");
    expect(renderChord(parseChord("3"), "A", "minor")).toBe("C");
    expect(renderChord(parseChord("4"), "A", "minor")).toBe("Dm");
    expect(renderChord(parseChord("5"), "A", "minor")).toBe("Em");
    expect(renderChord(parseChord("6"), "A", "minor")).toBe("F");
    expect(renderChord(parseChord("7"), "A", "minor")).toBe("G");
  });

  it("renders minor chords in minor key", () => {
    expect(renderChord(parseChord("4m"), "A", "minor")).toBe("Dm");
    expect(renderChord(parseChord("5m"), "A", "minor")).toBe("Em");
  });
});

describe("renderChord (enharmonic correctness)", () => {
  it("renders flats correctly when specified", () => {
    expect(renderChord(parseChord("b7"), "C", "major")).toBe("Bb");

    expect(renderChord(parseChord("b3"), "C", "major")).toBe("Eb");
  });

  it("respects accidental intent over key", () => {
    expect(renderChord(parseChord("b7"), "G", "major")).toBe("F"); // diatonic

    expect(renderChord(parseChord("#4"), "C", "major")).toBe("F#");
  });
});
