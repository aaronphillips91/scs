import type { ChordNode } from "../ast/types";

export function validateChord(chord: ChordNode) {
  const warnings: string[] = [];
  const errors: string[] = [];

  // sanity check
  if (chord.degree < 1 || chord.degree > 7) {
    errors.push("Invalid degree");
  }

  // conflicting modifiers
  if (chord.modifiers.includes("sus2") && chord.modifiers.includes("sus4")) {
    warnings.push("sus2 and sus4 conflict");
  }

  if (chord.modifiers.includes("maj7") && chord.modifiers.includes("7")) {
    warnings.push("maj7 and 7 conflict");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
