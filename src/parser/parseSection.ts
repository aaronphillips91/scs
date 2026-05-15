import type { LineNode, SegmentNode } from "../ast/types";
import { parseChord } from "./parseChord";

export function parseSection(content: string): LineNode[] {
  const lines = content.split("\n");

  return lines.map((line) => {
    const segments: SegmentNode[] = [];
    const parts = line.split(/\[([^\]]+)\]/g);

    // ✅ handle leading text
    if (parts[0]) {
      segments.push({ text: parts[0] });
    }

    // ✅ process chord + text pairs
    for (let i = 1; i < parts.length; i += 2) {
      const chordToken = parts[i]!;
      const text = parts[i + 1] ?? "";

      segments.push({
        chord: parseChord(chordToken),
        text,
      });
    }

    if (segments.length === 0) {
      segments.push({ text: line });
    }

    return {
      raw: line,
      segments,
    };
  });
}
