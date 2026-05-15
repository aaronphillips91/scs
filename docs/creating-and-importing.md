# Creating & Importing Songs

## Creating a song from scratch (key-based)

When a user writes chords using note names (e.g. `[E]`, `[A]`, `[B]`), convert each section to NNS before saving. You need to know the key and mode the user is writing in.

```typescript
import { chordProToSCS, SCSError } from "@song-chart/scs";

const key = "E";
const mode = "major";
const userInput = "[E]Amazing [A]grace [B]how sweet the sound";

try {
  const stored = chordProToSCS(userInput, key, mode);
  // → "[1]Amazing [4]grace [5]how sweet the sound"
  await db.sections.create({ song_id, label: "Verse", order_index: 0, content: stored });
} catch (e) {
  if (e instanceof SCSError) {
    showUserError(`Invalid chord: ${e.input}`);
  } else throw e;
}
```

### Minor keys

Pass `"minor"` as the mode. The library uses the natural minor scale by default.

```typescript
const stored = chordProToSCS("[Am]word [Dm]word [Em]word", "A", "minor");
// → "[1m]word [4m]word [5m]word"
```

### Chords with modifiers and slash chords

All standard ChordPro chord suffixes are supported and round-trip correctly.

```typescript
chordProToSCS("[Esus4]word [C#m7]word [B/D#]word", "E", "major");
// → "[1sus4]word [6m7]word [5/7]word"
```

---

## Creating a song in NNS mode

If the user writes directly in Nashville Numbers, the content is already in NNS format — store it as-is with no conversion.

```typescript
const userInput = "[1]Amazing [4]grace [5]how sweet";

// No conversion needed — store directly
await db.sections.create({ song_id, label: "Verse", order_index: 0, content: userInput });
```

NNS songs have `nns = true` in your `songs` table. You can still associate a default `tonic` and `mode` for setlist use:

```typescript
await db.songs.create({
  title: "Amazing Grace",
  nns: true,
  tonic: "Bb",   // optional default for setlists
  mode: "major",
});
```

---

## Importing a full ChordPro file

Use `parseSong` to parse a complete ChordPro document — it handles the title, key directive, and section labels automatically, then returns a structured `SongAST`.

```typescript
import { parseSong, serializeSection, SCSError } from "@song-chart/scs";

const chordProText = `
{title: Amazing Grace}
{key: G}

{start_of_verse: Verse 1}
[G]Amazing [C]grace [G]how sweet the [D]sound
{end_of_verse}

{start_of_chorus}
[G]Praise [C]God [G]from whom all [D]blessings [G]flow
{end_of_chorus}
`;

try {
  const song = parseSong(chordProText, "G");

  // Save song metadata
  await db.songs.create({
    title: song.title,           // "Amazing Grace"
    tonic: song.tonalContext.key, // "G"
    mode: song.tonalContext.mode, // "major"
    nns: false,
  });

  // Save each section
  for (const section of song.sections) {
    const content = serializeSection(section.lines); // NNS string
    await db.sections.create({
      song_id,
      label: section.label,           // "Verse 1", "Chorus"
      order_index: section.orderIndex,
      content,
    });
  }
} catch (e) {
  if (e instanceof SCSError) {
    showUserError(`Import failed: ${e.message}`);
  } else throw e;
}
```

### Supported ChordPro directives

| Directive | Description |
|-----------|-------------|
| `{title: Song Name}` | Song title |
| `{key: G}` or `{key: Am}` | Tonic and mode (`m` suffix = minor) |
| `{comment: Verse 1}` | Section label |
| `{start_of_verse}` / `{end_of_verse}` | Verse section block |
| `{start_of_chorus}` / `{end_of_chorus}` | Chorus section block |
| `{start_of_bridge}` / `{end_of_bridge}` | Bridge section block |
| `{start_of_intro}` / `{end_of_intro}` | Intro section block |
| `{start_of_outro}` / `{end_of_outro}` | Outro section block |
| `{start_of_pre_chorus}` / `{end_of_pre_chorus}` | Pre-chorus section block |
| `{start_of_tag}` / `{end_of_tag}` | Tag section block |
| Short forms: `{sov}`, `{soc}`, `{sob}`, `{eov}`, `{eoc}`, `{eob}` | Abbreviations |

Unknown directives are silently ignored.

---

## Parallel mode conversion on import

If a song is written in a major key but you want to store it for rendering in a minor mode (or vice versa), pass `targetMode` as the fourth argument to `parseSong` or `chordProToSCS`. The library applies a parallel mode quality conversion so the chord qualities are correct in the target scale.

```typescript
// Song written in E major, store for minor rendering
const stored = chordProToSCS("[E]root [C#m]six", "E", "major", "minor");
// I and IV become minor; III, VI, VII become major
```

This is an advanced use case — most songs should use the same source and target mode.
