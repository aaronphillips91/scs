import { describe, it, expect } from "vitest";
import { parseSong } from "../src/parser/parseSong";

describe("parseSong — metadata", () => {
  it("parses title from directive", () => {
    const song = parseSong("{title: Amazing Grace}\n[G]test", "G");
    expect(song.title).toBe("Amazing Grace");
  });

  it("defaults title to Untitled when missing", () => {
    const song = parseSong("[G]test", "G");
    expect(song.title).toBe("Untitled");
  });

  it("uses key from directive over parameter", () => {
    const song = parseSong("{key: D}\n[D]test", "G");
    expect(song.tonalContext.key).toBe("D");
  });

  it("detects minor mode from key directive", () => {
    const song = parseSong("{key: Am}\n[Am]test", "A");
    expect(song.tonalContext.mode).toBe("minor");
  });

  it("generates a unique id for the song", () => {
    const song = parseSong("[G]test", "G");
    expect(song.id).toBeTruthy();
  });

  it("generates unique ids for each section", () => {
    const input = "{comment: A}\n[G]test\n{comment: B}\n[C]test";
    const song = parseSong(input, "G");
    expect(song.sections[0].id).not.toBe(song.sections[1].id);
  });
});

describe("parseSong — sections from comment directives", () => {
  it("creates sections from {comment:} directives", () => {
    const input = "{comment: Verse 1}\n[G]line\n{comment: Chorus}\n[C]line";
    const song = parseSong(input, "G");
    expect(song.sections).toHaveLength(2);
    expect(song.sections[0].label).toBe("Verse 1");
    expect(song.sections[1].label).toBe("Chorus");
  });

  it("assigns orderIndex sequentially", () => {
    const input = "{comment: A}\n[G]a\n{comment: B}\n[C]b\n{comment: C}\n[D]c";
    const song = parseSong(input, "G");
    expect(song.sections.map((s) => s.orderIndex)).toEqual([0, 1, 2]);
  });

  it("captures content before any label as an unlabeled section", () => {
    const song = parseSong("[G]no label here", "G");
    expect(song.sections).toHaveLength(1);
    expect(song.sections[0].label).toBe("");
  });

  it("ignores empty sections between directives", () => {
    const input = "{comment: A}\n{comment: B}\n[G]content";
    const song = parseSong(input, "G");
    expect(song.sections).toHaveLength(1);
    expect(song.sections[0].label).toBe("B");
  });
});

describe("parseSong — sections from start/end directives", () => {
  it("creates sections from start_of_verse / end_of_verse", () => {
    const input = "{start_of_verse}\n[G]line\n{end_of_verse}";
    const song = parseSong(input, "G");
    expect(song.sections).toHaveLength(1);
    expect(song.sections[0].label).toBe("Verse");
  });

  it("creates sections from start_of_chorus / end_of_chorus", () => {
    const input = "{start_of_chorus}\n[C]line\n{end_of_chorus}";
    const song = parseSong(input, "G");
    expect(song.sections[0].label).toBe("Chorus");
  });

  it("uses inline label from start_of_verse directive", () => {
    const input = "{start_of_verse: Verse 1}\n[G]test\n{end_of_verse}";
    const song = parseSong(input, "G");
    expect(song.sections[0].label).toBe("Verse 1");
  });

  it("handles multiple sections with start/end directives", () => {
    const input = [
      "{start_of_verse}",
      "[G]verse line",
      "{end_of_verse}",
      "{start_of_chorus}",
      "[C]chorus line",
      "{end_of_chorus}",
    ].join("\n");
    const song = parseSong(input, "G");
    expect(song.sections).toHaveLength(2);
    expect(song.sections[0].label).toBe("Verse");
    expect(song.sections[1].label).toBe("Chorus");
  });
});

describe("parseSong — chord conversion", () => {
  it("converts ChordPro note names to SCS degrees", () => {
    const song = parseSong("{comment: V}\n[G]Amazing [C]grace", "G");
    const chords = song.sections[0].lines[0].segments.filter((s) => s.chord);
    expect(chords[0].chord?.degree).toBe(1); // G in G = 1
    expect(chords[1].chord?.degree).toBe(4); // C in G = 4
  });

  it("preserves lyrics alongside chords", () => {
    const song = parseSong("{comment: V}\n[G]Amazing grace", "G");
    const segments = song.sections[0].lines[0].segments;
    const textSegment = segments.find((s) => s.text.includes("Amazing"));
    expect(textSegment).toBeDefined();
  });

  it("applies parallel mode conversion when targetMode differs", () => {
    // C#m is degree 6m in E major; parallel minor → VI is major, stored without quality
    const song = parseSong("{comment: V}\n[C#m]word", "E", "major", "minor");
    const chords = song.sections[0].lines[0].segments.filter((s) => s.chord);
    expect(chords[0].chord?.degree).toBe(6);
    expect(chords[0].chord?.quality).toBeUndefined(); // M quality omitted in SCS
  });
});

describe("parseSong — Artist and Tempo directives", () => {
  it("parses {Artist:} directive and sets artist on AST", () => {
    const song = parseSong("{title: My Song}\n{Artist: Aaron Phillips}\n[G]test", "G");
    expect(song.artist).toBe("Aaron Phillips");
  });

  it("parses {Tempo:} directive and sets tempo on AST", () => {
    const song = parseSong("{title: My Song}\n{Tempo: 120}\n[G]test", "G");
    expect(song.tempo).toBe(120);
  });

  it("artist is undefined when directive is absent", () => {
    const song = parseSong("[G]test", "G");
    expect(song.artist).toBeUndefined();
  });

  it("tempo is undefined when directive is absent", () => {
    const song = parseSong("[G]test", "G");
    expect(song.tempo).toBeUndefined();
  });

  it("ignores non-numeric tempo values", () => {
    const song = parseSong("{Tempo: fast}\n[G]test", "G");
    expect(song.tempo).toBeUndefined();
  });

  it("parses all four header directives together", () => {
    const input = [
      "{Title: I Can't Hear A Word}",
      "{Artist: Aaron Phillips}",
      "{Key: G}",
      "{Tempo: 96}",
      "{Verse}",
      "[G]word",
    ].join("\n");
    const song = parseSong(input, "G");
    expect(song.title).toBe("I Can't Hear A Word");
    expect(song.artist).toBe("Aaron Phillips");
    expect(song.tempo).toBe(96);
    expect(song.tonalContext.key).toBe("G");
  });
});

describe("parseSong — simplified section shorthand", () => {
  it("opens a section from a bare {SectionName} tag", () => {
    const input = "{Verse}\n[G]Amazing grace";
    const song = parseSong(input, "G");
    expect(song.sections).toHaveLength(1);
    expect(song.sections[0].label).toBe("Verse");
  });

  it("uses the raw-case name as the label", () => {
    const song = parseSong("{Verse 1}\n[G]line", "G");
    expect(song.sections[0].label).toBe("Verse 1");
  });

  it("closes the previous section when a new shorthand tag appears", () => {
    const input = "{Verse}\n[G]line\n{Chorus}\n[C]line";
    const song = parseSong(input, "G");
    expect(song.sections).toHaveLength(2);
    expect(song.sections[0].label).toBe("Verse");
    expect(song.sections[1].label).toBe("Chorus");
  });

  it("closes the section at EOF without an explicit end tag", () => {
    const input = "{Intro}\n[Em] [Csus2] [G] [G/F#]";
    const song = parseSong(input, "G");
    expect(song.sections).toHaveLength(1);
    expect(song.sections[0].label).toBe("Intro");
    expect(song.sections[0].lines.length).toBeGreaterThan(0);
  });

  it("shorthand and verbose syntax produce same section count", () => {
    const shorthand = "{Verse}\n[G]line\n{Chorus}\n[C]line";
    const verbose = "{start_of_verse}\n[G]line\n{end_of_verse}\n{start_of_chorus}\n[C]line\n{end_of_chorus}";
    const a = parseSong(shorthand, "G");
    const b = parseSong(verbose, "G");
    expect(a.sections).toHaveLength(b.sections.length);
    expect(a.sections[0].label).toBe(b.sections[0].label);
    expect(a.sections[1].label).toBe(b.sections[1].label);
  });

  it("ignores unknown directives that have a value (non-empty)", () => {
    const song = parseSong("{SomeDirective: some value}\n[G]test", "G");
    expect(song.sections).toHaveLength(1);
    // directive with value is skipped — content is in an unlabeled section
    expect(song.sections[0].label).toBe("");
  });
});
