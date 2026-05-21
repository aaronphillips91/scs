import type { Mode } from "../ast/types";

export const NOTE_TO_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export const SHARP_CHROMATIC = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

export const FLAT_CHROMATIC = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
];

export const FLAT_MAJOR_KEYS = ["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
export const FLAT_MINOR_KEYS = ["D", "G", "C", "F", "Bb", "Eb", "Ab"];

export function transposeKey(key: string, semitones: number, mode: Mode): string {
  const index = NOTE_TO_INDEX[key];
  if (index === undefined) throw new Error(`Invalid key: ${key}`);
  const newIndex = ((index - semitones) % 12 + 12) % 12;
  const flatResult = FLAT_CHROMATIC[newIndex]!;
  const useFlats = mode === "major"
    ? FLAT_MAJOR_KEYS.includes(flatResult)
    : FLAT_MINOR_KEYS.includes(flatResult);
  return useFlats ? flatResult : SHARP_CHROMATIC[newIndex]!;
}
