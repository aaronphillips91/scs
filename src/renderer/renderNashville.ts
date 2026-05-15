import type { ChordNode, Mode, SongAST } from "../ast/types";
import { chordToNode, nodeToSCS } from "../import/chordPro";
import { parseSection } from "../parser/parseSection";
import { renderChord } from "./renderChord";

// Nashville-session-style NNS notation: degree numbers are always relative to
// the tonic's MAJOR scale, regardless of song mode.  Minor-key diatonic chords
// use b3/b6/b7 explicitly.  This is a one-way display format — the output is
// SCS-syntax-shaped but is not the storage format and should not be fed back
// through the default (mode-relative) parser.
//
// Implementation: resolve the chord to its concrete pitch (e.g. "Em"), then
// re-encode it as a major-scale-relative ChordNode and serialize with the
// major-mode omission rules.
export function renderChordNashville(
  chord: ChordNode,
  key: string,
  mode: Mode,
): string {
  const concrete = renderChord(chord, key, mode);
  const node = chordToNode(concrete, key, "major", "major");
  return nodeToSCS(node, "major");
}

type Segment = {
  chord?: ChordNode;
  text: string;
};

function findAvailablePosition(
  line: string,
  start: number,
  length: number,
): number {
  let pos = start;
  while (true) {
    let collision = false;
    for (let i = 0; i < length; i++) {
      if (line[pos + i] && line[pos + i] !== " ") {
        collision = true;
        break;
      }
    }
    if (!collision && pos > 0 && line[pos - 1] && line[pos - 1] !== " ") {
      collision = true;
    }
    if (!collision) {
      const rightIndex = pos + length;
      if (line[rightIndex] && line[rightIndex] !== " ") collision = true;
    }
    if (!collision) return pos;
    pos++;
  }
}

function layoutLine(
  segments: Segment[],
  getChordStr: (chord: ChordNode) => string,
): string {
  let chordLine = "";
  let lyricLine = "";

  for (const segment of segments) {
    const text = segment.text ?? "";
    const chordStr = segment.chord ? getChordStr(segment.chord) : "";

    const firstCharOffset = text.search(/\S/);
    const idealStart =
      lyricLine.length + (firstCharOffset === -1 ? 0 : firstCharOffset);

    if (chordStr) {
      const chordStart = findAvailablePosition(
        chordLine,
        idealStart,
        chordStr.length,
      );
      while (chordLine.length < chordStart) chordLine += " ";
      chordLine += chordStr;
    }

    const targetLength = lyricLine.length + text.length;
    while (chordLine.length < targetLength) chordLine += " ";
    lyricLine += text;
  }

  return chordLine + "\n" + lyricLine;
}

export function renderLineNashville(
  segments: Segment[],
  key: string,
  mode: Mode,
): string {
  return layoutLine(segments, (chord) => renderChordNashville(chord, key, mode));
}

export function renderSectionAsNashville(
  input: string,
  key: string,
  mode: Mode,
): string {
  return parseSection(input)
    .map((line) => renderLineNashville(line.segments, key, mode))
    .join("\n\n");
}

export function renderSongAsNashville(
  song: SongAST,
  key?: string,
  mode?: Mode,
): string {
  const renderKey = key ?? song.tonalContext.key;
  const renderMode = mode ?? song.tonalContext.mode;

  return song.sections
    .map((section) => {
      const rendered = section.lines
        .map((line) => renderLineNashville(line.segments, renderKey, renderMode))
        .join("\n\n");
      const header = section.label ? `[${section.label}]\n` : "";
      return `${header}${rendered}`;
    })
    .join("\n\n");
}
