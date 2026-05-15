import type { ChordNode, Mode } from "../ast/types";
import { NOTE_TO_INDEX } from "../music/theory";
import { getScaleQuality, qualityIsImplied } from "../music/quality";
import { SCSError } from "../errors";

const SHARP_CHROMATIC = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const FLAT_CHROMATIC = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const FLAT_MAJOR_KEYS = ["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
const FLAT_MINOR_KEYS = ["D", "G", "C", "F", "Bb", "Eb", "Ab"];

function prefersFlats(key: string, mode: Mode): boolean {
  return mode === "major"
    ? FLAT_MAJOR_KEYS.includes(key)
    : FLAT_MINOR_KEYS.includes(key);
}

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
const HARMONIC_MINOR_STEPS = [0, 2, 3, 5, 7, 8, 11];

function shiftNote(note: string, offset: number, useFlats: boolean): string {
  const baseIndex = NOTE_TO_INDEX[note];

  if (baseIndex === undefined) {
    throw new SCSError(`Invalid note: ${note}`, note);
  }

  const newIndex = (baseIndex + offset + 12) % 12;

  return (useFlats ? FLAT_CHROMATIC : SHARP_CHROMATIC)[newIndex]!;
}

function getScale(
  key: string,
  mode: Mode,
  useFlats: boolean,
  useHarmonicMinor: boolean,
): string[] {
  const rootIndex = NOTE_TO_INDEX[key];

  if (rootIndex === undefined) {
    throw new SCSError(`Invalid key: ${key}`, key);
  }

  const chromatic = useFlats ? FLAT_CHROMATIC : SHARP_CHROMATIC;

  let steps: number[];

  if (mode === "minor") {
    steps = useHarmonicMinor ? HARMONIC_MINOR_STEPS : MINOR_STEPS;
  } else {
    steps = MAJOR_STEPS;
  }

  return steps.map((step) => chromatic[(rootIndex + step) % 12]!);
}


function resolveQuality(chord: ChordNode, mode: Mode): "M" | "m" | "°" | "+" {
  const scaleQuality = getScaleQuality(chord.degree, mode);

  if (chord.quality === "°" || chord.quality === "+") return chord.quality;
  if (chord.accidental) return chord.quality ?? "M";
  if (chord.quality === undefined) return scaleQuality;
  return chord.quality;
}

// Canonical NNS form of a ChordNode: emit the explicit quality character only
// when it differs from the mode-inferred default, so e.g. `[6]` in G major
// renders back as `[6]` (not `[6m]`) and `[6M]` stays `[6M]` (borrowed VI).
export function renderChordNNS(chord: ChordNode, mode: Mode): string {
  let out = chord.accidental ?? "";
  out += chord.degree;
  if (!qualityIsImplied(chord, mode)) {
    if (chord.quality === "M") out += "M";
    if (chord.quality === "m") out += "m";
    if (chord.quality === "°") out += "°";
    if (chord.quality === "+") out += "+";
  }
  if (chord.modifiers.length) out += chord.modifiers.join("");
  if (chord.bass) out += `/${chord.bass.accidental ?? ""}${chord.bass.degree}`;
  return out;
}

export function renderChord(chord: ChordNode, key: string, mode: Mode): string {
  let useFlats = prefersFlats(key, mode);

  // accidental preference override
  if (chord.accidental === "b") useFlats = true;
  if (chord.accidental === "#") useFlats = false;

  const useHarmonicMinor =
    mode === "minor" && chord.degree === 5 && chord.quality === "M";

  const scale = getScale(key, mode, useFlats, useHarmonicMinor);

  let note = scale[chord.degree - 1]!;

  if (chord.accidental === "#") {
    note = shiftNote(note, 1, useFlats);
  }

  if (chord.accidental === "b") {
    note = shiftNote(note, -1, useFlats);
  }

  const finalQuality = resolveQuality(chord, mode);

  let output = note;

  if (finalQuality === "m") output += "m";
  if (finalQuality === "°") output += "dim";
  if (finalQuality === "+") output += "aug";
  if (chord.modifiers.length) {
    output += chord.modifiers.join("");
  }

  if (chord.bass) {
    let bassNote = scale[chord.bass.degree - 1]!;

    if (chord.bass.accidental === "#") {
      bassNote = shiftNote(bassNote, 1, useFlats);
    }

    if (chord.bass.accidental === "b") {
      bassNote = shiftNote(bassNote, -1, useFlats);
    }

    output += `/${bassNote}`;
  }

  return output;
}
