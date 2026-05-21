import { parseSection } from "../parser/parseSection";
import { renderLine, renderLineNNS } from "./renderLine";
import { transposeKey } from "../music/theory";
import type { Mode } from "../ast/types";

export function renderSection(input: string, key: string, mode: Mode, nns = false, capo = 0): string {
  const renderKey = capo > 0 ? transposeKey(key, capo, mode) : key;
  const lines = parseSection(input);
  return lines
    .map((line) => nns ? renderLineNNS(line.segments, mode) : renderLine(line.segments, renderKey, mode))
    .join("\n\n");
}
