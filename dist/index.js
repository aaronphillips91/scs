"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  SCSError: () => SCSError,
  chordProToSCS: () => chordProToSCS,
  chordToNode: () => chordToNode,
  nodeToSCS: () => nodeToSCS,
  parseChord: () => parseChord,
  parseSection: () => parseSection,
  parseSong: () => parseSong,
  renderChord: () => renderChord,
  renderChordNNS: () => renderChordNNS,
  renderChordNashville: () => renderChordNashville,
  renderLine: () => renderLine,
  renderLineNNS: () => renderLineNNS,
  renderLineNashville: () => renderLineNashville,
  renderSection: () => renderSection,
  renderSectionAsNashville: () => renderSectionAsNashville,
  renderSong: () => renderSong,
  renderSongAsNashville: () => renderSongAsNashville,
  serializeSection: () => serializeSection,
  serializeSong: () => serializeSong,
  validateChord: () => validateChord
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var SCSError = class extends Error {
  constructor(message, input) {
    super(message);
    this.input = input;
    this.name = "SCSError";
  }
};

// src/music/theory.ts
var NOTE_TO_INDEX = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11
};

// src/music/quality.ts
function getScaleQuality(degree, mode) {
  const i = degree - 1;
  if (mode === "major") {
    return ["M", "m", "m", "M", "M", "m", "\xB0"][i];
  }
  return ["m", "\xB0", "M", "m", "m", "M", "M"][i];
}
function inferredQuality(degree, accidental, mode) {
  if (accidental) return "M";
  return getScaleQuality(degree, mode);
}
function qualityIsImplied(chord, mode) {
  if (chord.quality === void 0) return true;
  return chord.quality === inferredQuality(chord.degree, chord.accidental, mode);
}

// src/import/chordPro.ts
var VALID_MODIFIER_RE = /^(sus4|sus2|sus|add9|maj7|13|11|9|7|6)*$/;
function normalizeModifier(mod) {
  return mod.replace(/dim/g, "\xB0").replace(/aug/g, "+");
}
function validateModifiers(modStr, chord) {
  if (!VALID_MODIFIER_RE.test(modStr)) {
    throw new SCSError(`Invalid chord: ${chord}`, chord);
  }
}
function getNoteIndex(note) {
  const index = NOTE_TO_INDEX[note];
  if (index === void 0) throw new SCSError(`Invalid note: ${note}`, note);
  return index;
}
function intervalToDegreeString(interval, mode) {
  if (mode === "minor") {
    const natural2 = {
      0: "1",
      2: "2",
      3: "3",
      5: "4",
      7: "5",
      8: "6",
      10: "7"
    };
    if (interval in natural2) return natural2[interval];
    if (interval === 1) return "#1";
    if (interval === 4) return "#3";
    if (interval === 6) return "#4";
    if (interval === 9) return "#6";
    if (interval === 11) return "#7";
    throw new SCSError(`Unhandled interval: ${interval}`, String(interval));
  }
  const natural = {
    0: "1",
    2: "2",
    4: "3",
    5: "4",
    7: "5",
    9: "6",
    11: "7"
  };
  if (interval in natural) return natural[interval];
  if (interval === 1) return "#1";
  if (interval === 3) return "b3";
  if (interval === 6) return "#4";
  if (interval === 8) return "b6";
  if (interval === 10) return "b7";
  throw new SCSError(`Unhandled interval: ${interval}`, String(interval));
}
function applyParallelMinorQuality(degree, quality, modifiers) {
  if (modifiers.length > 0) return quality;
  if (quality === "+" || quality === "\xB0") return quality;
  if (degree === 5) return quality;
  if ((degree === 1 || degree === 4) && quality === "M") return "m";
  if ((degree === 3 || degree === 6 || degree === 7) && quality === "m") return "M";
  return quality;
}
function applyParallelMajorQuality(degree, quality, modifiers) {
  if (modifiers.length > 0) return quality;
  if (quality === "+" || quality === "\xB0") return quality;
  if (degree === 5) return quality;
  if ((degree === 1 || degree === 4) && quality === "m") return "M";
  if ((degree === 3 || degree === 6 || degree === 7) && quality === "M") return "m";
  return quality;
}
function chordToNode(chord, key, sourceMode, targetMode) {
  const [main, bass] = chord.split("/", 2);
  if (!main) throw new SCSError(`Invalid chord: ${chord}`, chord);
  const rootMatch = main.match(/^([A-G][b#]?)/);
  if (!rootMatch) throw new SCSError(`Invalid chord: ${chord}`, chord);
  const root = rootMatch[1];
  const rawModifier = main.slice(root.length);
  const mod = normalizeModifier(rawModifier);
  const rootIndex = getNoteIndex(root);
  const keyIndex = getNoteIndex(key);
  const interval = (rootIndex - keyIndex + 12) % 12;
  const degreeStr = intervalToDegreeString(interval, sourceMode);
  const accidental = degreeStr.startsWith("#") ? "#" : degreeStr.startsWith("b") ? "b" : void 0;
  const degree = parseInt(degreeStr.replace(/[#b]/, ""), 10);
  let quality = "M";
  let modifiers = [];
  if (mod.startsWith("\xB0")) {
    quality = "\xB0";
    const rest = mod.slice(1);
    validateModifiers(rest, chord);
    if (rest) modifiers.push(rest);
  } else if (mod.startsWith("+")) {
    quality = "+";
    const rest = mod.slice(1);
    validateModifiers(rest, chord);
    if (rest) modifiers.push(rest);
  } else if (mod.startsWith("m") && !mod.startsWith("maj")) {
    quality = "m";
    const rest = mod.slice(1);
    validateModifiers(rest, chord);
    if (rest) modifiers.push(rest);
  } else {
    quality = "M";
    validateModifiers(mod, chord);
    if (mod) modifiers.push(mod);
  }
  if (sourceMode !== targetMode && !accidental) {
    if (sourceMode === "major" && targetMode === "minor") {
      quality = applyParallelMinorQuality(degree, quality, modifiers);
    } else if (sourceMode === "minor" && targetMode === "major") {
      quality = applyParallelMajorQuality(degree, quality, modifiers);
    }
  }
  let bassNode;
  if (bass) {
    const bassMatch = bass.match(/^([A-G][b#]?)/);
    if (!bassMatch) throw new SCSError(`Invalid bass note: ${bass}`, bass);
    const bassRoot = bassMatch[1];
    const bassIndex = getNoteIndex(bassRoot);
    const bassInterval = (bassIndex - keyIndex + 12) % 12;
    const bassDegree = intervalToDegreeString(bassInterval, targetMode);
    const bassAcc = bassDegree.startsWith("#") ? "#" : bassDegree.startsWith("b") ? "b" : void 0;
    bassNode = {
      degree: parseInt(bassDegree.replace(/[#b]/, ""), 10),
      ...bassAcc ? { accidental: bassAcc } : {}
    };
  }
  return {
    degree,
    ...accidental ? { accidental } : {},
    ...quality !== void 0 ? { quality } : {},
    modifiers,
    ...bassNode ? { bass: bassNode } : {},
    raw: chord
  };
}
function nodeToSCS(node, mode) {
  let out = "";
  if (node.accidental) out += node.accidental;
  out += node.degree;
  if (!qualityIsImplied(node, mode)) {
    if (node.quality === "M") out += "M";
    if (node.quality === "m") out += "m";
    if (node.quality === "\xB0") out += "\xB0";
    if (node.quality === "+") out += "+";
  }
  if (node.modifiers.length) out += node.modifiers.join("");
  if (node.bass) out += `/${node.bass.accidental ?? ""}${node.bass.degree}`;
  return out;
}
function convertLine(line, key, sourceMode, targetMode) {
  return line.replace(/\[([^\]]+)\]/g, (_, chord) => {
    const node = chordToNode(chord, key, sourceMode, targetMode);
    return `[${nodeToSCS(node, targetMode)}]`;
  });
}
function chordProToSCS(input, sourceKey, sourceMode = "major", targetMode = sourceMode) {
  return input.split("\n").map((line) => convertLine(line, sourceKey, sourceMode, targetMode)).join("\n");
}

// src/parser/parseChord.ts
var MODIFIER_REGEX = /(sus4|sus2|sus|add9|maj7|13|11|9|7|6)/g;
var CHORD_REGEX = /^([b#]?)([1-7])(M|m|°|\+)?((?:sus4|sus2|sus|add9|maj7|13|11|9|7|6)*)?(?:\/([b#]?[1-7]))?$/;
function parseDegree(value) {
  const num = Number(value);
  if (num < 1 || num > 7) {
    throw new SCSError(`Invalid degree: ${value}`, value);
  }
  return num;
}
function normalizeAccidental(value) {
  return value === "b" || value === "#" ? value : void 0;
}
function normalizeQuality(value) {
  return value === "M" || value === "m" || value === "\xB0" || value === "+" ? value : void 0;
}
function parseChord(token) {
  const match = token.match(CHORD_REGEX);
  if (!match) {
    throw new SCSError(`Invalid chord token: ${token}`, token);
  }
  const [, accidental, degree, quality, mods, bass] = match;
  const modifiers = [];
  if (mods) {
    let m;
    while ((m = MODIFIER_REGEX.exec(mods)) !== null) {
      modifiers.push(m[0]);
    }
  }
  if (modifiers.includes("sus2") && modifiers.includes("sus4")) {
    throw new SCSError("Invalid chord: cannot contain both sus2 and sus4", token);
  }
  if (modifiers.includes("maj7") && modifiers.includes("7")) {
    throw new SCSError("Invalid chord: cannot contain both maj7 and 7", token);
  }
  let bassObj;
  if (bass) {
    const bassMatch = bass.match(/^([b#]?)([1-7])$/);
    if (bassMatch) {
      const bassAcc = normalizeAccidental(bassMatch[1]);
      const bassDegree = parseDegree(bassMatch[2]);
      bassObj = {
        degree: bassDegree
      };
      if (bassAcc) {
        bassObj.accidental = bassAcc;
      }
    }
  }
  const chord = {
    degree: parseDegree(degree),
    modifiers,
    raw: token
  };
  const acc = normalizeAccidental(accidental);
  if (acc) {
    chord.accidental = acc;
  }
  const qual = normalizeQuality(quality);
  if (qual) {
    chord.quality = qual;
  }
  if (bassObj) {
    chord.bass = bassObj;
  }
  return chord;
}

// src/parser/parseSection.ts
function parseSection(content) {
  const lines = content.split("\n");
  return lines.map((line) => {
    const segments = [];
    const parts = line.split(/\[([^\]]+)\]/g);
    if (parts[0]) {
      segments.push({ text: parts[0] });
    }
    for (let i = 1; i < parts.length; i += 2) {
      const chordToken = parts[i];
      const text = parts[i + 1] ?? "";
      segments.push({
        chord: parseChord(chordToken),
        text
      });
    }
    if (segments.length === 0) {
      segments.push({ text: line });
    }
    return {
      raw: line,
      segments
    };
  });
}

// src/parser/parseSong.ts
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function parseKeyDirective(value) {
  const trimmed = value.trim();
  if (trimmed.endsWith("m")) {
    return { key: trimmed.slice(0, -1), mode: "minor" };
  }
  return { key: trimmed, mode: "major" };
}
function parseDirective(line) {
  const match = line.match(/^\{([^:}]+)(?::([^}]*))?\}$/);
  if (!match) return null;
  return {
    name: match[1].trim().toLowerCase(),
    value: (match[2] ?? "").trim()
  };
}
var SECTION_START_LABELS = {
  start_of_verse: "Verse",
  sov: "Verse",
  start_of_chorus: "Chorus",
  soc: "Chorus",
  start_of_bridge: "Bridge",
  sob: "Bridge",
  start_of_tag: "Tag",
  start_of_outro: "Outro",
  start_of_intro: "Intro",
  start_of_pre_chorus: "Pre-Chorus"
};
var SECTION_END_DIRECTIVES = /* @__PURE__ */ new Set([
  "end_of_verse",
  "eov",
  "end_of_chorus",
  "eoc",
  "end_of_bridge",
  "eob",
  "end_of_tag",
  "end_of_outro",
  "end_of_intro",
  "end_of_pre_chorus"
]);
function parseSong(input, sourceKey, sourceMode = "major", targetMode) {
  const lines = input.split("\n");
  let title = "Untitled";
  let resolvedKey = sourceKey;
  let resolvedSourceMode = sourceMode;
  let resolvedTargetMode = targetMode ?? sourceMode;
  const hasExplicitTargetMode = targetMode !== void 0;
  const sections = [];
  let currentLabel = "";
  let currentContent = [];
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
      lines: parsedLines
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
        currentLabel = value || SECTION_START_LABELS[name];
        continue;
      }
      if (SECTION_END_DIRECTIVES.has(name)) {
        flushSection();
        currentLabel = "";
        continue;
      }
      continue;
    }
    currentContent.push(line);
  }
  flushSection();
  return {
    id: generateId(),
    title,
    tonalContext: {
      key: resolvedKey,
      mode: resolvedTargetMode
    },
    sections
  };
}

// src/renderer/renderChord.ts
var SHARP_CHROMATIC = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];
var FLAT_CHROMATIC = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B"
];
var FLAT_MAJOR_KEYS = ["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
var FLAT_MINOR_KEYS = ["D", "G", "C", "F", "Bb", "Eb", "Ab"];
function prefersFlats(key, mode) {
  return mode === "major" ? FLAT_MAJOR_KEYS.includes(key) : FLAT_MINOR_KEYS.includes(key);
}
var MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
var MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
var HARMONIC_MINOR_STEPS = [0, 2, 3, 5, 7, 8, 11];
function shiftNote(note, offset, useFlats) {
  const baseIndex = NOTE_TO_INDEX[note];
  if (baseIndex === void 0) {
    throw new SCSError(`Invalid note: ${note}`, note);
  }
  const newIndex = (baseIndex + offset + 12) % 12;
  return (useFlats ? FLAT_CHROMATIC : SHARP_CHROMATIC)[newIndex];
}
function getScale(key, mode, useFlats, useHarmonicMinor) {
  const rootIndex = NOTE_TO_INDEX[key];
  if (rootIndex === void 0) {
    throw new SCSError(`Invalid key: ${key}`, key);
  }
  const chromatic = useFlats ? FLAT_CHROMATIC : SHARP_CHROMATIC;
  let steps;
  if (mode === "minor") {
    steps = useHarmonicMinor ? HARMONIC_MINOR_STEPS : MINOR_STEPS;
  } else {
    steps = MAJOR_STEPS;
  }
  return steps.map((step) => chromatic[(rootIndex + step) % 12]);
}
function resolveQuality(chord, mode) {
  const scaleQuality = getScaleQuality(chord.degree, mode);
  if (chord.quality === "\xB0" || chord.quality === "+") return chord.quality;
  if (chord.accidental) return chord.quality ?? "M";
  if (chord.quality === void 0) return scaleQuality;
  return chord.quality;
}
function renderChordNNS(chord, mode) {
  let out = chord.accidental ?? "";
  out += chord.degree;
  if (!qualityIsImplied(chord, mode)) {
    if (chord.quality === "M") out += "M";
    if (chord.quality === "m") out += "m";
    if (chord.quality === "\xB0") out += "\xB0";
    if (chord.quality === "+") out += "+";
  }
  if (chord.modifiers.length) out += chord.modifiers.join("");
  if (chord.bass) out += `/${chord.bass.accidental ?? ""}${chord.bass.degree}`;
  return out;
}
function renderChord(chord, key, mode) {
  let useFlats = prefersFlats(key, mode);
  if (chord.accidental === "b") useFlats = true;
  if (chord.accidental === "#") useFlats = false;
  const useHarmonicMinor = mode === "minor" && chord.degree === 5 && chord.quality === "M";
  const scale = getScale(key, mode, useFlats, useHarmonicMinor);
  let note = scale[chord.degree - 1];
  if (chord.accidental === "#") {
    note = shiftNote(note, 1, useFlats);
  }
  if (chord.accidental === "b") {
    note = shiftNote(note, -1, useFlats);
  }
  const finalQuality = resolveQuality(chord, mode);
  let output = note;
  if (finalQuality === "m") output += "m";
  if (finalQuality === "\xB0") output += "dim";
  if (finalQuality === "+") output += "aug";
  if (chord.modifiers.length) {
    output += chord.modifiers.join("");
  }
  if (chord.bass) {
    let bassNote = scale[chord.bass.degree - 1];
    if (chord.bass.accidental === "#") {
      bassNote = shiftNote(bassNote, 1, useFlats);
    }
    if (chord.bass.accidental === "b") {
      bassNote = shiftNote(bassNote, -1, useFlats);
    }
    output += `/${bassNote}`;
  }
  return output;
}

// src/renderer/renderLine.ts
function findAvailablePosition(line, start, length) {
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
function layoutLine(segments, getChordStr) {
  let chordLine = "";
  let lyricLine = "";
  for (const segment of segments) {
    const text = segment.text ?? "";
    const chordStr = segment.chord ? getChordStr(segment.chord) : "";
    const firstCharOffset = text.search(/\S/);
    const idealStart = lyricLine.length + (firstCharOffset === -1 ? 0 : firstCharOffset);
    if (chordStr) {
      const chordStart = findAvailablePosition(
        chordLine,
        idealStart,
        chordStr.length
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
function renderLine(segments, key, mode) {
  return layoutLine(segments, (chord) => renderChord(chord, key, mode));
}
function renderLineNNS(segments, mode) {
  return layoutLine(segments, (chord) => renderChordNNS(chord, mode));
}

// src/renderer/renderNashville.ts
function renderChordNashville(chord, key, mode) {
  const concrete = renderChord(chord, key, mode);
  const node = chordToNode(concrete, key, "major", "major");
  return nodeToSCS(node, "major");
}
function findAvailablePosition2(line, start, length) {
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
function layoutLine2(segments, getChordStr) {
  let chordLine = "";
  let lyricLine = "";
  for (const segment of segments) {
    const text = segment.text ?? "";
    const chordStr = segment.chord ? getChordStr(segment.chord) : "";
    const firstCharOffset = text.search(/\S/);
    const idealStart = lyricLine.length + (firstCharOffset === -1 ? 0 : firstCharOffset);
    if (chordStr) {
      const chordStart = findAvailablePosition2(
        chordLine,
        idealStart,
        chordStr.length
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
function renderLineNashville(segments, key, mode) {
  return layoutLine2(segments, (chord) => renderChordNashville(chord, key, mode));
}
function renderSectionAsNashville(input, key, mode) {
  return parseSection(input).map((line) => renderLineNashville(line.segments, key, mode)).join("\n\n");
}
function renderSongAsNashville(song, key, mode) {
  const renderKey = key ?? song.tonalContext.key;
  const renderMode = mode ?? song.tonalContext.mode;
  return song.sections.map((section) => {
    const rendered = section.lines.map((line) => renderLineNashville(line.segments, renderKey, renderMode)).join("\n\n");
    const header = section.label ? `[${section.label}]
` : "";
    return `${header}${rendered}`;
  }).join("\n\n");
}

// src/renderer/renderSection.ts
function renderSection(input, key, mode, nns = false) {
  const lines = parseSection(input);
  return lines.map((line) => nns ? renderLineNNS(line.segments, mode) : renderLine(line.segments, key, mode)).join("\n\n");
}

// src/renderer/renderSong.ts
function renderSong(song, key, mode, nns = false) {
  const renderKey = key ?? song.tonalContext.key;
  const renderMode = mode ?? song.tonalContext.mode;
  return song.sections.map((section) => {
    const renderedLines = section.lines.map((line) => nns ? renderLineNNS(line.segments, renderMode) : renderLine(line.segments, renderKey, renderMode)).join("\n\n");
    const header = section.label ? `[${section.label}]
` : "";
    return `${header}${renderedLines}`;
  }).join("\n\n");
}

// src/serializer/serializeSection.ts
function serializeSection(lines) {
  return lines.map(
    (line) => line.segments.map((seg) => {
      if (!seg.chord) return seg.text;
      return `[${seg.chord.raw}]${seg.text}`;
    }).join("")
  ).join("\n");
}

// src/serializer/serializeSong.ts
function serializeKey(key, mode) {
  return mode === "minor" ? `${key}m` : key;
}
function serializeSong(song) {
  const parts = [];
  parts.push(`{title: ${song.title}}`);
  parts.push(`{key: ${serializeKey(song.tonalContext.key, song.tonalContext.mode)}}`);
  const sections = [...song.sections].sort((a, b) => a.orderIndex - b.orderIndex);
  for (const section of sections) {
    const content = serializeSection(section.lines);
    const label = section.label ? `{comment: ${section.label}}
` : "";
    parts.push(`${label}${content}`);
  }
  return parts.join("\n\n");
}

// src/validator/validateChord.ts
function validateChord(chord) {
  const warnings = [];
  const errors = [];
  if (chord.degree < 1 || chord.degree > 7) {
    errors.push("Invalid degree");
  }
  if (chord.modifiers.includes("sus2") && chord.modifiers.includes("sus4")) {
    warnings.push("sus2 and sus4 conflict");
  }
  if (chord.modifiers.includes("maj7") && chord.modifiers.includes("7")) {
    warnings.push("maj7 and 7 conflict");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SCSError,
  chordProToSCS,
  chordToNode,
  nodeToSCS,
  parseChord,
  parseSection,
  parseSong,
  renderChord,
  renderChordNNS,
  renderChordNashville,
  renderLine,
  renderLineNNS,
  renderLineNashville,
  renderSection,
  renderSectionAsNashville,
  renderSong,
  renderSongAsNashville,
  serializeSection,
  serializeSong,
  validateChord
});
