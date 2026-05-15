import type { SongAST, Mode } from "../ast/types";
import { renderLine, renderLineNNS } from "./renderLine";

export function renderSong(song: SongAST, key?: string, mode?: Mode, nns = false): string {
  const renderKey = key ?? song.tonalContext.key;
  const renderMode = mode ?? song.tonalContext.mode;

  return song.sections
    .map((section) => {
      const renderedLines = section.lines
        .map((line) => nns ? renderLineNNS(line.segments, renderMode) : renderLine(line.segments, renderKey, renderMode))
        .join("\n\n");

      const header = section.label ? `[${section.label}]\n` : "";
      return `${header}${renderedLines}`;
    })
    .join("\n\n");
}
