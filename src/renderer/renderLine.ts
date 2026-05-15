import type { Mode, ChordNode } from "../ast/types";
import { renderChord, renderChordNNS } from "./renderChord";

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

    if (!collision && pos > 0) {
      if (line[pos - 1] && line[pos - 1] !== " ") {
        collision = true;
      }
    }

    if (!collision) {
      const rightIndex = pos + length;
      if (line[rightIndex] && line[rightIndex] !== " ") {
        collision = true;
      }
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

      while (chordLine.length < chordStart) {
        chordLine += " ";
      }

      chordLine += chordStr;
    }

    const targetLength = lyricLine.length + text.length;

    while (chordLine.length < targetLength) {
      chordLine += " ";
    }

    lyricLine += text;
  }

  return chordLine + "\n" + lyricLine;
}

export function renderLine(
  segments: Segment[],
  key: string,
  mode: Mode,
): string {
  return layoutLine(segments, (chord) => renderChord(chord, key, mode));
}

export function renderLineNNS(segments: Segment[], mode: Mode): string {
  return layoutLine(segments, (chord) => renderChordNNS(chord, mode));
}
