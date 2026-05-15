import type { ChordNode, Mode } from "../ast/types";
import { NOTE_TO_INDEX } from "../music/theory";
import { qualityIsImplied } from "../music/quality";
import { SCSError } from "../errors";

const VALID_MODIFIER_RE = /^(sus4|sus2|sus|add9|maj7|13|11|9|7|6)*$/;

function normalizeModifier(mod: string): string {
  return mod.replace(/dim/g, "°").replace(/aug/g, "+");
}

function validateModifiers(modStr: string, chord: string): void {
  if (!VALID_MODIFIER_RE.test(modStr)) {
    throw new SCSError(`Invalid chord: ${chord}`, chord);
  }
}

function getNoteIndex(note: string): number {
  const index = NOTE_TO_INDEX[note];
  if (index === undefined) throw new SCSError(`Invalid note: ${note}`, note);
  return index;
}

// Maps a chromatic interval (0-11) from the tonic to an SCS degree string.
// The mode determines which 7 intervals are "natural" scale degrees (no accidental).
//
// Major natural degrees:  0  2  4  5  7  9  11  → 1 2 3 4 5 6 7
// Minor natural degrees:  0  2  3  5  7  8  10  → 1 2 3 4 5 6 7
//
// Non-diatonic intervals get labelled relative to the chosen scale, so the same
// note can have a different degree string depending on context:
//   C# in E major (9 semitones) → "6"   (natural 6th of major)
//   C# in E minor (9 semitones) → "#6"  (raised 6th of minor, because C natural = "6" in minor)
function intervalToDegreeString(interval: number, mode: Mode): string {
  if (mode === "minor") {
    const natural: Record<number, string> = {
      0: "1", 2: "2", 3: "3", 5: "4", 7: "5", 8: "6", 10: "7",
    };
    if (interval in natural) return natural[interval]!;
    if (interval === 1)  return "#1";
    if (interval === 4)  return "#3";
    if (interval === 6)  return "#4";
    if (interval === 9)  return "#6";
    if (interval === 11) return "#7";
    throw new SCSError(`Unhandled interval: ${interval}`, String(interval));
  }

  const natural: Record<number, string> = {
    0: "1", 2: "2", 4: "3", 5: "4", 7: "5", 9: "6", 11: "7",
  };
  if (interval in natural) return natural[interval]!;
  if (interval === 1)  return "#1";
  if (interval === 3)  return "b3";
  if (interval === 6)  return "#4";
  if (interval === 8)  return "b6";
  if (interval === 10) return "b7";
  throw new SCSError(`Unhandled interval: ${interval}`, String(interval));
}

// Parallel major → minor quality conversion.
//
// When the source is in a major key and the target is the parallel minor, the diatonic
// chord qualities shift.  Only clean triads on diatonic degrees are transformed;
// chords with extensions (maj7, sus, add9 …) or non-standard qualities (°, +) are
// left as-is so the caller's intent is always respected.
//
//   I, IV  major  →  minor   (e.g. A → Am, E → Em)
//   III, VI, VII  minor  →  major  (e.g. C#m → C = bVI, F#m → F = bIII)
//   V  stays as specified  (harmonic-minor dominant convention)
function applyParallelMinorQuality(
  degree: number,
  quality: ChordNode["quality"],
  modifiers: ChordNode["modifiers"],
): ChordNode["quality"] {
  if (modifiers.length > 0)                                          return quality;
  if (quality === "+" || quality === "°")                           return quality;
  if (degree === 5)                                                  return quality;
  if ((degree === 1 || degree === 4) && quality === "M")            return "m";
  if ((degree === 3 || degree === 6 || degree === 7) && quality === "m") return "M";
  return quality;
}

// Parallel minor → major quality conversion (inverse of the above).
//
//   i, iv  minor  →  major   (e.g. Am → A, Dm → D)
//   bIII, bVI, bVII  major  →  minor   (e.g. C → C#m = iii, F → F#m = vi)
//   V  stays as specified
function applyParallelMajorQuality(
  degree: number,
  quality: ChordNode["quality"],
  modifiers: ChordNode["modifiers"],
): ChordNode["quality"] {
  if (modifiers.length > 0)                                          return quality;
  if (quality === "+" || quality === "°")                           return quality;
  if (degree === 5)                                                  return quality;
  if ((degree === 1 || degree === 4) && quality === "m")            return "M";
  if ((degree === 3 || degree === 6 || degree === 7) && quality === "M") return "m";
  return quality;
}

// Convert a single ChordPro chord string to a ChordNode whose degree labels are
// correct for rendering in the given sourceKey + sourceMode context.
//
// When targetMode differs from sourceMode, a parallel mode quality conversion is
// applied so that the stored quality makes sense when rendered in the target mode.
//
// Bass notes always use targetMode (falling back to sourceMode) for their degree
// label so their absolute pitch is preserved under rendering.
export function chordToNode(
  chord: string,
  key: string,
  sourceMode: Mode,
  targetMode: Mode,
): ChordNode {
  const [main, bass] = chord.split("/", 2);
  if (!main) throw new SCSError(`Invalid chord: ${chord}`, chord);

  const rootMatch = main.match(/^([A-G][b#]?)/);
  if (!rootMatch) throw new SCSError(`Invalid chord: ${chord}`, chord);

  const root = rootMatch[1] as string;
  const rawModifier = main.slice(root.length);
  const mod = normalizeModifier(rawModifier);

  const rootIndex = getNoteIndex(root);
  const keyIndex  = getNoteIndex(key);
  const interval  = (rootIndex - keyIndex + 12) % 12;

  // Degree labelling uses the SOURCE scale so that "natural" degrees (no accidental)
  // correspond to notes that are diatonic in the source key.
  //   major source: C# in E → "6"  (C# is the natural 6th of E major)
  //   minor source: C  in A → "3"  (C  is the natural 3rd of A minor)
  const degreeStr  = intervalToDegreeString(interval, sourceMode);
  const accidental = degreeStr.startsWith("#") ? "#"
                   : degreeStr.startsWith("b") ? "b"
                   : undefined;
  const degree = parseInt(degreeStr.replace(/[#b]/, ""), 10) as 1|2|3|4|5|6|7;

  // Parse quality and modifiers from the ChordPro suffix.
  let quality: ChordNode["quality"] = "M";
  let modifiers: ChordNode["modifiers"] = [];

  if (mod.startsWith("°")) {
    quality = "°";
    const rest = mod.slice(1);
    validateModifiers(rest, chord);
    if (rest) modifiers.push(rest as any);
  } else if (mod.startsWith("+")) {
    quality = "+";
    const rest = mod.slice(1);
    validateModifiers(rest, chord);
    if (rest) modifiers.push(rest as any);
  } else if (mod.startsWith("m") && !mod.startsWith("maj")) {
    quality = "m";
    const rest = mod.slice(1);
    validateModifiers(rest, chord);
    if (rest) modifiers.push(rest as any);
  } else {
    quality = "M";
    validateModifiers(mod, chord);
    if (mod) modifiers.push(mod as any);
  }

  // Apply parallel mode quality conversion for diatonic (non-accidental) degrees when
  // the source and target modes differ.  Accidental degrees are left untouched because
  // they are already non-diatonic borrowed chords whose quality should be preserved.
  if (sourceMode !== targetMode && !accidental) {
    if (sourceMode === "major" && targetMode === "minor") {
      quality = applyParallelMinorQuality(degree, quality, modifiers);
    } else if (sourceMode === "minor" && targetMode === "major") {
      quality = applyParallelMajorQuality(degree, quality, modifiers);
    }
  }

  // Bass note: labelled in targetMode context so its absolute pitch is preserved
  // when renderChord resolves the degree against the target scale.
  let bassNode: ChordNode["bass"];
  if (bass) {
    const bassMatch = bass.match(/^([A-G][b#]?)/);
    if (!bassMatch) throw new SCSError(`Invalid bass note: ${bass}`, bass);

    const bassRoot     = bassMatch[1] as string;
    const bassIndex    = getNoteIndex(bassRoot);
    const bassInterval = (bassIndex - keyIndex + 12) % 12;
    const bassDegree   = intervalToDegreeString(bassInterval, targetMode);
    const bassAcc      = bassDegree.startsWith("#") ? "#"
                       : bassDegree.startsWith("b") ? "b"
                       : undefined;

    bassNode = {
      degree: parseInt(bassDegree.replace(/[#b]/, ""), 10),
      ...(bassAcc ? { accidental: bassAcc } : {}),
    };
  }

  return {
    degree,
    ...(accidental ? { accidental } : {}),
    ...(quality !== undefined ? { quality } : {}),
    modifiers,
    ...(bassNode ? { bass: bassNode } : {}),
    raw: chord,
  };
}

// AST → SCS string (canonical format).
//
// The explicit quality character is emitted only when it differs from the
// mode-inferred default for the degree.  Examples in G major:
//   Em (degree 6, quality m) → [6]     (m is the default for degree 6 in major)
//   E  (degree 6, quality M) → [6M]    (M differs from default m, so emit)
//   Eb (b6, quality M)        → [b6]    (M is the default for accidental degrees)
//   Ebm (b6, quality m)       → [b6m]   (m differs from accidental default M)
export function nodeToSCS(node: ChordNode, mode: Mode): string {
  let out = "";
  if (node.accidental) out += node.accidental;
  out += node.degree;
  if (!qualityIsImplied(node, mode)) {
    if (node.quality === "M") out += "M";
    if (node.quality === "m") out += "m";
    if (node.quality === "°") out += "°";
    if (node.quality === "+") out += "+";
  }
  if (node.modifiers.length) out += node.modifiers.join("");
  if (node.bass) out += `/${node.bass.accidental ?? ""}${node.bass.degree}`;
  return out;
}

function convertLine(
  line: string,
  key: string,
  sourceMode: Mode,
  targetMode: Mode,
): string {
  return line.replace(/\[([^\]]+)\]/g, (_, chord) => {
    const node = chordToNode(chord, key, sourceMode, targetMode);
    return `[${nodeToSCS(node, targetMode)}]`;
  });
}

// Convert a ChordPro string to SCS degree notation.
//
// Parameters
// ----------
// input       — ChordPro text (chords in [brackets])
// sourceKey   — the tonic of the source song (e.g. "E", "Bb")
// sourceMode  — the mode of the source song (default: "major")
// targetMode  — the mode the SCS will be rendered in (default: same as sourceMode)
//               When sourceMode ≠ targetMode a parallel mode quality conversion is
//               applied so that chord qualities are correct under the target scale.
//
// Examples
// --------
//   Major → major (pure transposition, qualities preserved):
//     chordProToSCS(song, "E", "major")          // render in any major key
//
//   Major → minor (parallel mode conversion):
//     chordProToSCS(song, "E", "major", "minor") // render in E minor or any minor key
//
//   Minor → minor (pure transposition):
//     chordProToSCS(song, "Am", "minor")         // render in any minor key
//
//   Minor → major (parallel mode conversion):
//     chordProToSCS(song, "A", "minor", "major") // render in A major or any major key
export function chordProToSCS(
  input: string,
  sourceKey: string,
  sourceMode: Mode = "major",
  targetMode: Mode = sourceMode,
): string {
  return input
    .split("\n")
    .map((line) => convertLine(line, sourceKey, sourceMode, targetMode))
    .join("\n");
}
