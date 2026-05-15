import { describe, it, expect } from "vitest";
import { parseSong } from "../src/parser/parseSong";
import { serializeSong } from "../src/serializer/serializeSong";

describe("serializeSong — metadata", () => {
  it("outputs title directive", () => {
    const song = parseSong("{title: Amazing Grace}\n[G]test", "G");
    expect(serializeSong(song)).toContain("{title: Amazing Grace}");
  });

  it("outputs key directive for major", () => {
    const song = parseSong("[G]test", "G");
    expect(serializeSong(song)).toContain("{key: G}");
  });

  it("outputs key directive for minor with trailing m", () => {
    const song = parseSong("[Am]test", "A", "minor");
    expect(serializeSong(song)).toContain("{key: Am}");
  });
});

describe("serializeSong — sections", () => {
  it("outputs comment directive for labeled sections", () => {
    const song = parseSong("{comment: Verse}\n[G]line", "G");
    expect(serializeSong(song)).toContain("{comment: Verse}");
  });

  it("omits comment directive for unlabeled sections", () => {
    const song = parseSong("[G]no label", "G");
    expect(serializeSong(song)).not.toContain("{comment:");
  });

  it("outputs sections in orderIndex order", () => {
    const input = "{comment: A}\n[G]a\n{comment: B}\n[C]b";
    const song = parseSong(input, "G");
    const out = serializeSong(song);
    expect(out.indexOf("{comment: A}")).toBeLessThan(out.indexOf("{comment: B}"));
  });

  it("preserves SCS degree notation in content", () => {
    const song = parseSong("{comment: V}\n[G]Amazing [C]grace", "G");
    const out = serializeSong(song);
    expect(out).toContain("[1]");
    expect(out).toContain("[4]");
  });

  it("preserves lyrics", () => {
    const song = parseSong("{comment: V}\n[G]Amazing grace", "G");
    expect(serializeSong(song)).toContain("Amazing grace");
  });
});
