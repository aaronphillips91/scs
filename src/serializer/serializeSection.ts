import type { LineNode } from "../ast/types";

export function serializeSection(lines: LineNode[]): string {
  return lines
    .map((line) =>
      line.segments
        .map((seg) => {
          if (!seg.chord) return seg.text;
          return `[${seg.chord.raw}]${seg.text}`;
        })
        .join(""),
    )
    .join("\n");
}
