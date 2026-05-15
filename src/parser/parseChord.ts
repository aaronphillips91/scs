import type { ChordNode, Modifier } from "../ast/types";
import { SCSError } from "../errors";

// Allowed modifiers (longer alternatives must come first to avoid partial matches)
const MODIFIER_REGEX = /(sus4|sus2|sus|add9|maj7|13|11|9|7|6)/g;

// Full chord token regex
const CHORD_REGEX =
  /^([b#]?)([1-7])(M|m|°|\+)?((?:sus4|sus2|sus|add9|maj7|13|11|9|7|6)*)?(?:\/([b#]?[1-7]))?$/;

/**
 * Safely parse and narrow degree to 1–7
 */
function parseDegree(value: string): ChordNode["degree"] {
  const num = Number(value);

  if (num < 1 || num > 7) {
    throw new SCSError(`Invalid degree: ${value}`, value);
  }

  return num as ChordNode["degree"];
}

/**
 * Narrow accidental to valid literal type
 */
function normalizeAccidental(value: string | undefined): "b" | "#" | undefined {
  return value === "b" || value === "#" ? value : undefined;
}

/**
 * Narrow quality to valid literal type
 */
function normalizeQuality(
  value: string | undefined,
): "M" | "m" | "°" | "+" | undefined {
  return value === "M" || value === "m" || value === "°" || value === "+"
    ? value
    : undefined;
}

/**
 * Parse a single SCS chord token into a ChordNode
 */
export function parseChord(token: string): ChordNode {
  const match = token.match(CHORD_REGEX);

  if (!match) {
    throw new SCSError(`Invalid chord token: ${token}`, token);
  }

  const [, accidental, degree, quality, mods, bass] = match;

  // Parse modifiers
  const modifiers: Modifier[] = [];

  if (mods) {
    let m: RegExpExecArray | null;

    while ((m = MODIFIER_REGEX.exec(mods)) !== null) {
      modifiers.push(m[0] as Modifier);
    }
  }

  if (modifiers.includes("sus2") && modifiers.includes("sus4")) {
    throw new SCSError("Invalid chord: cannot contain both sus2 and sus4", token);
  }

  if (modifiers.includes("maj7") && modifiers.includes("7")) {
    throw new SCSError("Invalid chord: cannot contain both maj7 and 7", token);
  }

  // Parse bass
  let bassObj: ChordNode["bass"];

  if (bass) {
    const bassMatch = bass.match(/^([b#]?)([1-7])$/);

    if (bassMatch) {
      const bassAcc = normalizeAccidental(bassMatch[1]);
      const bassDegree = parseDegree(bassMatch[2]!);

      bassObj = {
        degree: bassDegree,
      };

      if (bassAcc) {
        bassObj.accidental = bassAcc;
      }
    }
  }

  // Build chord object WITHOUT assigning undefined
  const chord: ChordNode = {
    degree: parseDegree(degree!),
    modifiers,
    raw: token,
  };

  const acc = normalizeAccidental(accidental);
  if (acc) {
    chord.accidental = acc;
  }

  const qual = normalizeQuality(quality);
  if (qual) {
    chord.quality = qual;
  }

  if (bassObj) {
    chord.bass = bassObj;
  }

  return chord;
}
