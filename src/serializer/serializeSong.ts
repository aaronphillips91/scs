import type { SongAST, Mode } from "../ast/types";
import { serializeSection } from "./serializeSection";

function serializeKey(key: string, mode: Mode): string {
  return mode === "minor" ? `${key}m` : key;
}

export function serializeSong(song: SongAST): string {
  const parts: string[] = [];

  parts.push(`{title: ${song.title}}`);
  parts.push(`{key: ${serializeKey(song.tonalContext.key, song.tonalContext.mode)}}`);

  const sections = [...song.sections].sort((a, b) => a.orderIndex - b.orderIndex);

  for (const section of sections) {
    const content = serializeSection(section.lines);
    const label = section.label ? `{comment: ${section.label}}\n` : "";
    parts.push(`${label}${content}`);
  }

  return parts.join("\n\n");
}
