import type { SongAST, SectionNode, Mode } from "../ast/types";
import { chordProToSCS } from "../import/chordPro";
import { parseSection } from "./parseSection";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function parseKeyDirective(value: string): { key: string; mode: Mode } {
  const trimmed = value.trim();
  if (trimmed.endsWith("m")) {
    return { key: trimmed.slice(0, -1), mode: "minor" };
  }
  return { key: trimmed, mode: "major" };
}

function parseDirective(line: string): { name: string; value: string } | null {
  const match = line.match(/^\{([^:}]+)(?::([^}]*))?\}$/);
  if (!match) return null;
  return {
    name: match[1]!.trim().toLowerCase(),
    value: (match[2] ?? "").trim(),
  };
}

const SECTION_START_LABELS: Record<string, string> = {
  start_of_verse: "Verse",
  sov: "Verse",
  start_of_chorus: "Chorus",
  soc: "Chorus",
  start_of_bridge: "Bridge",
  sob: "Bridge",
  start_of_tag: "Tag",
  start_of_outro: "Outro",
  start_of_intro: "Intro",
  start_of_pre_chorus: "Pre-Chorus",
};

const SECTION_END_DIRECTIVES = new Set([
  "end_of_verse", "eov",
  "end_of_chorus", "eoc",
  "end_of_bridge", "eob",
  "end_of_tag",
  "end_of_outro",
  "end_of_intro",
  "end_of_pre_chorus",
]);

// Parse a full ChordPro string into a SongAST.
//
// sourceKey  — tonic of the song as written (overridden by {key:} directive if present)
// sourceMode — mode of the song as written (default: major)
// targetMode — mode to store degrees in (default: same as sourceMode)
//              When targetMode differs, parallel mode quality conversion is applied.
export function parseSong(
  input: string,
  sourceKey: string,
  sourceMode: Mode = "major",
  targetMode?: Mode,
): SongAST {
  const lines = input.split("\n");

  let title = "Untitled";
  let resolvedKey = sourceKey;
  let resolvedSourceMode = sourceMode;
  // When targetMode is not explicitly provided, it tracks sourceMode (including from directives)
  let resolvedTargetMode: Mode = targetMode ?? sourceMode;
  const hasExplicitTargetMode = targetMode !== undefined;

  const sections: SectionNode[] = [];
  let currentLabel = "";
  let currentContent: string[] = [];
  let orderIndex = 0;

  function flushSection() {
    const content = currentContent.join("\n").trim();
    currentContent = [];
    if (!content) return;

    const scs = chordProToSCS(content, resolvedKey, resolvedSourceMode, resolvedTargetMode);
    const parsedLines = parseSection(scs);

    sections.push({
      id: generateId(),
      label: currentLabel,
      orderIndex: orderIndex++,
      lines: parsedLines,
    });
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const directive = parseDirective(trimmed);

    if (directive) {
      const { name, value } = directive;

      if (name === "title" || name === "t") {
        title = value;
        continue;
      }

      if (name === "key" || name === "k") {
        const parsed = parseKeyDirective(value);
        resolvedKey = parsed.key;
        resolvedSourceMode = parsed.mode;
        if (!hasExplicitTargetMode) resolvedTargetMode = parsed.mode;
        continue;
      }

      if (name === "comment" || name === "c") {
        flushSection();
        currentLabel = value;
        continue;
      }

      if (name in SECTION_START_LABELS) {
        flushSection();
        currentLabel = value || SECTION_START_LABELS[name]!;
        continue;
      }

      if (SECTION_END_DIRECTIVES.has(name)) {
        flushSection();
        currentLabel = "";
        continue;
      }

      continue; // unknown directives are ignored
    }

    currentContent.push(line);
  }

  flushSection();

  return {
    id: generateId(),
    title,
    tonalContext: {
      key: resolvedKey,
      mode: resolvedTargetMode,
    },
    sections,
  };
}
