import type { Mode } from "../ast/types";
import { transposeKey } from "./theory";

export type CapoSuggestion = {
  capo: number;
  playingKey: string;
  common: boolean;
};

const GUITAR_FRIENDLY_MAJOR = ["G", "D", "A", "E", "C", "F"];
const GUITAR_FRIENDLY_MINOR = ["A", "E", "D", "G", "C"];
const COMMON_MAJOR = new Set(["G", "D", "A", "E"]);
const COMMON_MINOR = new Set(["A", "E", "D"]);

export function getCapoSuggestions(key: string, mode: Mode): CapoSuggestion[] {
  const friendly = mode === "major" ? GUITAR_FRIENDLY_MAJOR : GUITAR_FRIENDLY_MINOR;
  const common = mode === "major" ? COMMON_MAJOR : COMMON_MINOR;
  const results: CapoSuggestion[] = [];

  for (let capo = 1; capo <= 7; capo++) {
    const playingKey = transposeKey(key, capo, mode);
    if (friendly.includes(playingKey)) {
      results.push({ capo, playingKey, common: common.has(playingKey) });
    }
  }

  return results;
}
