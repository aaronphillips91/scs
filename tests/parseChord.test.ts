import { describe, it, expect } from "vitest";
import { parseChord } from "../src/parser/parseChord";

describe("parseChord", () => {
  it("parses simple degree", () => {
    const chord = parseChord("1");

    expect(chord).toEqual({
      degree: 1,
      modifiers: [],
      raw: "1",
    });
  });

  it("parses accidental", () => {
    const chord = parseChord("b7");

    expect(chord).toEqual({
      degree: 7,
      accidental: "b",
      modifiers: [],
      raw: "b7",
    });
  });

  it("parses quality", () => {
    const chord = parseChord("4m");

    expect(chord).toEqual({
      degree: 4,
      quality: "m",
      modifiers: [],
      raw: "4m",
    });
  });

  it("parses modifiers", () => {
    const chord = parseChord("5sus4");

    expect(chord).toEqual({
      degree: 5,
      modifiers: ["sus4"],
      raw: "5sus4",
    });
  });

  it("parses multiple modifiers", () => {
    const chord = parseChord("1maj713");

    expect(chord.modifiers).toEqual(["maj7", "13"]);
  });

  it("parses bass note", () => {
    const chord = parseChord("5/7");

    expect(chord).toEqual({
      degree: 5,
      modifiers: [],
      bass: { degree: 7 },
      raw: "5/7",
    });
  });

  it("parses accidental bass", () => {
    const chord = parseChord("1/b3");

    expect(chord).toEqual({
      degree: 1,
      modifiers: [],
      bass: {
        degree: 3,
        accidental: "b",
      },
      raw: "1/b3",
    });
  });

  it("throws on invalid chord", () => {
    expect(() => parseChord("8")).toThrow();
  });

  it("throws on malformed chord", () => {
    expect(() => parseChord("1sus2sus4")).toThrow();
  });
});
