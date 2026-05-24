export type Mode = "major" | "minor";

export type SongAST = {
  id: string;
  title: string;
  artist?: string;
  tempo?: number;

  tonalContext: {
    key: string;
    mode: Mode;
  };

  sections: SectionNode[];
};

export type SectionNode = {
  id: string;
  label: string;
  orderIndex: number;

  transpose?: number;

  lines: LineNode[];
};

export type LineNode = {
  raw: string;
  segments: SegmentNode[];
};

export type SegmentNode = {
  text: string;
  chord?: ChordNode;
};

export type Modifier =
  | "sus2"
  | "sus4"
  | "add9"
  | "6"
  | "7"
  | "9"
  | "11"
  | "13"
  | "maj7";

export type ChordNode = {
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  accidental?: "b" | "#";
  quality?: "M" | "m" | "°" | "+";
  modifiers: Modifier[];

  bass?: {
    degree: number;
    accidental?: "b" | "#";
  };

  raw?: string;

  // v2 extension placeholder
  analysis?: {
    secondaryDominant?: { targetDegree: number };
    borrowedFrom?: "minor" | "dorian" | "mixolydian";
    functionLabel?: string;
  };
};
