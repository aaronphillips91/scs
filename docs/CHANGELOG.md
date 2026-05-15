# Change Log

A running summary of large changes to the codebase. Add a new section at the top whenever a non-trivial change lands.

---

## 2026-05-12 — NNS quality omission + Nashville-session render style

**The bug.** Typing an `Em` chord in a G-major song serialized to `[6m]` instead of `[6]`. Standard NNS treats `[6]` in a major key as already implying the minor vi — the explicit `m` is redundant noise. Same issue affected NNS *display*: a song stored as `[2]` rendered as `2m` rather than the canonical bare `2`.

**Root cause.** Two places emitted the quality character unconditionally:

- `nodeToSCS()` in [src/import/chordPro.ts](../src/import/chordPro.ts) (ChordPro → SCS serialization)
- `renderChordNNS()` in [src/renderer/renderChord.ts](../src/renderer/renderChord.ts) (ChordNode → NNS display)

Neither consulted the mode-inferred default quality for the degree before emitting.

**The fix.** Added a shared helper [src/music/quality.ts](../src/music/quality.ts) that knows the mode-inferred default for any (degree, accidental, mode) triple. Both serialization paths now omit the quality character when it matches the default, and emit it explicitly otherwise. Pitch resolution in `renderChord()` is unchanged — mode-relative numbering remains correct under SCS's locked-mode model.

**New feature — Nashville-session render style.** Some users prefer NNS notation where degrees are always relative to the tonic's *major* scale, with minor-key diatonic chords written `[b3]`, `[b6]`, `[b7]`. Added a one-way display transformer that resolves each chord to its concrete pitch, then re-encodes it as major-scale-relative NNS. Exposed as:

- `renderChordNashville(node, key, mode)` — single chord
- `renderLineNashville(segments, key, mode)`
- `renderSectionAsNashville(input, key, mode)`
- `renderSongAsNashville(song, key?, mode?)`

Storage stays mode-relative; the Nashville form is a display/export option only.

**Behavior changes worth knowing.**

- `Em` in G major now serializes as `[6]` (was `[6m]`).
- `F#` (major triad) in G major now serializes as `[7M]` (was `[7]`). The bare `[7]` had been silently round-tripping to F#dim because the diatonic default at degree 7 is diminished; the explicit `M` disambiguates.
- NNS-mode display of bare tokens like `[2]`, `[3]`, `[6]`, `[7]` no longer expands them to `[2m]`, `[3m]`, `[6m]`, `[7°]`. They display in their canonical bare form.

**Files added.**

- [src/music/quality.ts](../src/music/quality.ts)
- [src/renderer/renderNashville.ts](../src/renderer/renderNashville.ts)
- [tests/renderNashville.test.ts](../tests/renderNashville.test.ts)

**Files modified.**

- [src/import/chordPro.ts](../src/import/chordPro.ts) — mode-aware `nodeToSCS`; `chordToNode` exported.
- [src/renderer/renderChord.ts](../src/renderer/renderChord.ts) — `renderChordNNS` omits implied qualities; harmonic-minor dead branch in `resolveQuality` removed.
- [src/index.ts](../src/index.ts) — Nashville renderer exports.
- [docs/chord-syntax.md](chord-syntax.md) — added explicit "Numbering convention" section, replaced quality-suffix table with mode-by-mode defaults, noted the Nashville alternate display.
- [tests/chordProImporter.test.ts](../tests/chordProImporter.test.ts), [tests/renderNNS.test.ts](../tests/renderNNS.test.ts) — assertions updated for the new canonical forms; new round-trip + minor-mode coverage added.
