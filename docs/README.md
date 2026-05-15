# SCS — Song Chart System

SCS is a TypeScript library for storing and rendering chord charts in a key-independent format. Chords are stored as **scale degrees** (Nashville Number System) rather than note names, so a song saved once can be rendered in any key without re-saving.

## How it works

Every song goes through three steps:

```
User input (ChordPro or NNS)
        ↓
  Store as NNS/SCS          ← one source of truth in your database
        ↓
  Render in any key          ← on demand, no re-saving required
```

A chord written as `[E]` in E major is stored as `[1]` (the first degree). When rendered in G major, it becomes `G`. The lyrics and structure stay exactly the same — only the note names change.

## Core concepts

**Degrees** — chords are stored as scale positions 1–7, not note names.

**Quality** — if you don't write one, the scale decides. `[4]` in C major renders as F (major). `[2]` renders as Dm (minor). Write `[4m]` to explicitly force minor (borrowed chord).

**NNS (Nashville Number System)** — the stored format. `[1]Amazing [4]grace [5]how sweet` is a valid NNS section string.

**SCS format** — a superset of NNS with support for accidentals (`[b7]`), qualities (`[4m]`, `[5M]`), modifiers (`[1maj7]`, `[5sus4]`), and slash chords (`[5/7]`).

## Quick start

```typescript
import { chordProToSCS, renderSection, SCSError } from "@song-chart/scs";

// Convert user input (written in E major) to NNS for storage
const stored = chordProToSCS("[E]Amazing [A]grace", "E", "major");
// → "[1]Amazing [4]grace"

// Render stored NNS in any key
renderSection(stored, "G", "major");
// → "G           C\nAmazing grace"

// Render as NNS numbers
renderSection(stored, "G", "major", true);
// → "1           4\nAmazing grace"
```

## Documentation

- [Creating & Importing Songs](./creating-and-importing.md)
- [Storing Songs](./storing.md)
- [Rendering & Display](./rendering.md)
- [Error Handling & Validation](./error-handling.md)
- [Chord Syntax Reference](./chord-syntax.md)

## API reference

| Function | Description |
|----------|-------------|
| `chordProToSCS(input, key, mode, targetMode?)` | Convert ChordPro note names to NNS/SCS degrees |
| `parseSong(input, key, mode, targetMode?)` | Parse a full ChordPro song into a `SongAST` |
| `renderSection(content, key, mode, nns?)` | Render a stored NNS section in a target key |
| `renderSong(song, key?, mode?, nns?)` | Render a full `SongAST` |
| `serializeSong(song)` | Serialize a `SongAST` back to an SCS string |
| `serializeSection(lines)` | Serialize `LineNode[]` to an SCS string |
| `parseSection(input)` | Parse an NNS/SCS string into `LineNode[]` |
| `parseChord(token)` | Parse a single SCS chord token into a `ChordNode` |
| `renderChord(chord, key, mode)` | Render a single `ChordNode` to a note name string |
| `validateChord(token)` | Validate an SCS chord token without throwing |
| `SCSError` | Error class thrown by all library functions |
