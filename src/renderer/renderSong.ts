import type { SongAST, Mode } from "../ast/types";
import { renderLine, renderLineNNS } from "./renderLine";
import { transposeKey } from "../music/theory";

export function renderSong(song: SongAST, key?: string, mode?: Mode, nns = false, capo = 0): string {
  const resolvedKey = key ?? song.tonalContext.key;
  const renderMode = mode ?? song.tonalContext.mode;
  const renderKey = capo > 0 ? transposeKey(resolvedKey, capo, renderMode) : resolvedKey;

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
