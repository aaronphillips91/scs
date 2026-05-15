import type { ChordNode, Mode } from "../ast/types";

export type Quality = "M" | "m" | "°" | "+";

// Scale-derived triad quality for each degree (1-indexed) under each mode.
//   Major:        I  ii  iii  IV  V  vi  vii°
//   Natural minor: i  ii°  III  iv  v  VI  VII
export function getScaleQuality(degree: number, mode: Mode): Quality {
  const i = degree - 1;
  if (mode === "major") {
    return (["M", "m", "m", "M", "M", "m", "°"] as const)[i]!;
  }
  return (["m", "°", "M", "m", "m", "M", "M"] as const)[i]!;
}

// The quality that a bare degree token (no explicit quality char) would imply
// in the given mode.  Accidental degrees (b3, #4 …) are non-diatonic borrowed
// chords whose implied default is always M.
export function inferredQuality(
  degree: number,
  accidental: "b" | "#" | undefined,
  mode: Mode,
): Quality {
  if (accidental) return "M";
  return getScaleQuality(degree, mode);
}

// Whether the node's quality is redundant with the mode-inferred default and
// can therefore be omitted when emitting NNS text.  Used by the canonical
// serializer (chord → SCS) and by the NNS chord renderer (ChordNode → NNS).
export function qualityIsImplied(chord: ChordNode, mode: Mode): boolean {
  if (chord.quality === undefined) return true;
  return chord.quality === inferredQuality(chord.degree, chord.accidental, mode);
}
