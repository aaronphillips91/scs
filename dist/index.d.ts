type Mode = "major" | "minor";
type SongAST = {
    id: string;
    title: string;
    tonalContext: {
        key: string;
        mode: Mode;
    };
    sections: SectionNode[];
};
type SectionNode = {
    id: string;
    label: string;
    orderIndex: number;
    transpose?: number;
    lines: LineNode[];
};
type LineNode = {
    raw: string;
    segments: SegmentNode[];
};
type SegmentNode = {
    text: string;
    chord?: ChordNode;
};
type Modifier = "sus2" | "sus4" | "add9" | "6" | "7" | "9" | "11" | "13" | "maj7";
type ChordNode = {
    degree: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    accidental?: "b" | "#";
    quality?: "M" | "m" | "°" | "+";
    modifiers: Modifier[];
    bass?: {
        degree: number;
        accidental?: "b" | "#";
    };
    raw?: string;
    analysis?: {
        secondaryDominant?: {
            targetDegree: number;
        };
        borrowedFrom?: "minor" | "dorian" | "mixolydian";
        functionLabel?: string;
    };
};

declare class SCSError extends Error {
    readonly input?: string | undefined;
    constructor(message: string, input?: string | undefined);
}

declare function chordToNode(chord: string, key: string, sourceMode: Mode, targetMode: Mode): ChordNode;
declare function nodeToSCS(node: ChordNode, mode: Mode): string;
declare function chordProToSCS(input: string, sourceKey: string, sourceMode?: Mode, targetMode?: Mode): string;

/**
 * Parse a single SCS chord token into a ChordNode
 */
declare function parseChord(token: string): ChordNode;

declare function parseSection(content: string): LineNode[];

declare function parseSong(input: string, sourceKey: string, sourceMode?: Mode, targetMode?: Mode): SongAST;

declare function renderChordNNS(chord: ChordNode, mode: Mode): string;
declare function renderChord(chord: ChordNode, key: string, mode: Mode): string;

type Segment$1 = {
    chord?: ChordNode;
    text: string;
};
declare function renderLine(segments: Segment$1[], key: string, mode: Mode): string;
declare function renderLineNNS(segments: Segment$1[], mode: Mode): string;

declare function renderChordNashville(chord: ChordNode, key: string, mode: Mode): string;
type Segment = {
    chord?: ChordNode;
    text: string;
};
declare function renderLineNashville(segments: Segment[], key: string, mode: Mode): string;
declare function renderSectionAsNashville(input: string, key: string, mode: Mode): string;
declare function renderSongAsNashville(song: SongAST, key?: string, mode?: Mode): string;

declare function renderSection(input: string, key: string, mode: Mode, nns?: boolean): string;

declare function renderSong(song: SongAST, key?: string, mode?: Mode, nns?: boolean): string;

declare function serializeSection(lines: LineNode[]): string;

declare function serializeSong(song: SongAST): string;

declare function validateChord(chord: ChordNode): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};

export { type ChordNode, type LineNode, type Mode, type Modifier, SCSError, type SectionNode, type SegmentNode, type SongAST, chordProToSCS, chordToNode, nodeToSCS, parseChord, parseSection, parseSong, renderChord, renderChordNNS, renderChordNashville, renderLine, renderLineNNS, renderLineNashville, renderSection, renderSectionAsNashville, renderSong, renderSongAsNashville, serializeSection, serializeSong, validateChord };
