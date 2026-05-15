import { parseSection } from "../parser/parseSection";
import { renderLine, renderLineNNS } from "./renderLine";
import type { Mode } from "../ast/types";

export function renderSection(input: string, key: string, mode: Mode, nns = false): string {
  const lines = parseSection(input);
  return lines
    .map((line) => nns ? renderLineNNS(line.segments, mode) : renderLine(line.segments, key, mode))
    .join("\n\n");
}
