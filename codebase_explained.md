# SCS (Song Chart System) – Project Overview

## Purpose

SCS is a music-aware chord rendering engine designed to:

1. Parse chord charts (ChordPro, SCS format)
2. Convert chords into a degree-based representation
3. Render chords correctly in any key and mode
4. Preserve musical correctness (not just transposition)

This system is intended for real-world worship music usage, where harmonic accuracy matters.

---

## Core Concept

The system is built on this principle:

> Chords are stored as scale degrees, not absolute notes.

Example:

| Absolute    | SCS    |
| ----------- | ------ |
| C           | 1      |
| G           | 5      |
| Am          | 6m     |
| B/D# (in E) | 5 / 7# |

This allows:

- Key changes without rewriting charts
- Consistent structure across songs
- Intelligent harmonic rendering

---

## Architecture Overview

### 1. Import Layer (/import)

Responsibility: Convert external formats (ChordPro) → SCS

Key file:

- chordPro.ts

Important behavior:

- Extract root note + modifiers
- Convert to degree relative to key
- Preserve:
  - quality (M, m, °, +)
  - modifiers (sus, add9, etc.)
- DO NOT attempt to "fix" harmony here

---

### 2. Parser Layer (/parser)

Responsibility: Convert SCS string → AST

Key files:

- parseChord.ts
- parseSection.ts

Outputs structured data:

ts type ChordNode = { degree: 1–7 accidental?: "#" | "b" quality?: "M" | "m" | "°" | "+" modifiers: Modifier[] bass?: { degree, accidental? } raw: string }

Important:

- This layer is syntax-only, not musical

---

### 3. Renderer Layer (/renderer)

Responsibility: Convert AST → final chord output

Key files:

- renderChord.ts
- renderLine.ts
- renderSection.ts

This is where music theory lives.

---

## Critical Musical Logic

### 1. Scale Generation

Located in renderChord.ts

Supports:

- Major scale
- Natural minor
- Harmonic minor (auto-detected)

ts MAJOR: [0,2,4,5,7,9,11] NATURAL_MINOR: [0,2,3,5,7,8,10] HARMONIC_MINOR: [0,2,3,5,7,8,11]

---

### 2. Harmonic Minor Detection

Rule:

ts if (mode === "minor" && degree === 5 && quality === "M")

→ Use harmonic minor

Reason:

- V chord in minor is usually major in real music

---

### 3. Quality Resolution (VERY IMPORTANT)

This is the most sensitive logic in the system.

ts finalQuality = explicit quality (if musically valid) ELSE scale-derived quality

Rules:

| Case                 | Behavior                        |
| -------------------- | ------------------------------- |
| ° / +                | Always preserved                |
| m                    | Only preserved if matches scale |
| M (V chord in minor) | Preserved                       |
| otherwise            | Use scale default               |

---

### 4. Example (E Major → E Minor)

| Input | Output |
| ----- | ------ |
| C#m   | C      |
| B     | B      |
| B/D#  | B/D#   |
| A     | Am     |

---

## Rendering System

### Line Rendering

Produces:

G C D Amazing grace how sweet

Key behaviors:

- Chords align above lyrics
- No global shifting
- Minimal spacing adjustments
- Collisions handled locally

---

### Section Rendering

- Splits into lines
- Renders each line independently
- Joins with correct spacing

---

## Key Invariants (DO NOT BREAK)

### 1. Separation of Concerns

| Layer    | Responsibility      |
| -------- | ------------------- |
| Importer | capture intent      |
| Parser   | structure           |
| Renderer | musical correctness |

---

### 2. Quality Handling

text Importer: preserves Renderer: decides

DO NOT:

- blindly trust imported quality
- blindly override everything with scale

---

### 3. Degree System Integrity

All chords must resolve from:

text degree + mode + context → final chord

NOT:
text original chord string → output

---

### 4. No Information Loss

Avoid:

text Chord → string → re-parse → lose intent

Prefer:

text Chord → AST → render

---

## Supported Features

✔ Major keys  
✔ Natural minor  
✔ Harmonic minor (auto-detected)  
✔ Slash chords  
✔ Accidentals (# / b degrees)  
✔ Modifiers (sus, add, etc.)  
✔ ChordPro import  
✔ SCS parsing  
✔ Aligned lyric rendering

---

## Known Limitations (Future Work)

- No melodic minor
- No secondary dominants (V/V, etc.)
- No borrowed chord system (♭7, etc.)
- No global harmonic context (per-section detection)
- Limited modifier parsing depth

---

## Development Philosophy

This project prioritizes:

text musical correctness > convenience

Decisions should favor:

- predictable harmonic behavior
- consistency across keys
- real-world usability

---

## When Making Changes

Always verify:

1. Does this break minor key behavior?
2. Does this affect harmonic minor?
3. Does this override intentional chord input?
4. Does this introduce ambiguity?

If unsure:

- prefer renderer-based fixes
- avoid importer hacks

---

## Summary

SCS is a musically intelligent rendering engine, not just a formatter.

It converts:

text ChordPro → structured harmony → correct musical output

The system is now:

- theoretically sound
- practically usable
- extensible for advanced harmony

---

## Maintainer Notes

If modifying chord logic:

> You are editing music theory, not just code.

Test with:

- major → minor transitions
- V chord behavior
- slash chords
- real worship songs

---

End of file.
