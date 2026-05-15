# Rendering & Display

All rendering functions take stored NNS/SCS content and return a formatted string with **chords positioned above lyrics** on two lines:

```
G           C    D
Amazing grace how sweet the sound
```

This format is designed for **monospace fonts**. Use a font like `JetBrains Mono`, `Fira Code`, or `Courier New` in your UI.

---

## Rendering in a specific key

```typescript
import { renderSection } from "@song-chart/scs";

const content = "[1]Amazing [4]grace [5]how sweet"; // stored NNS

renderSection(content, "G", "major");
// G           C    D
// Amazing grace how sweet

renderSection(content, "Bb", "major");
// Bb          Eb   F
// Amazing grace how sweet

renderSection(content, "E", "major");
// E           A    B
// Amazing grace how sweet
```

The same stored content renders correctly in any key — no re-saving needed.

---

## Rendering in NNS (numbers)

Pass `true` as the fourth argument to render chord numbers instead of note names. The scale-appropriate quality suffix is applied automatically.

```typescript
renderSection(content, "G", "major", true);
// 1           4    5
// Amazing grace how sweet
```

Quality suffixes are shown when they apply:

```typescript
// Major scale: 2, 3, 6 are minor; 7 is diminished
renderSection("[2]word [3]word [6]word [7]word", "G", "major", true);
// 2m  3m  6m  7°
// word word word word
```

The `key` argument is still required when `nns = true` but is not used for rendering — it's there for API consistency. Only `mode` affects NNS quality resolution.

---

## Toggling between NNS and chord letters

Because `renderSection` is a pure, fast function, toggling is simply a matter of calling it with a different `nns` flag — no caching or pre-computation needed.

**React example:**

```tsx
const [nns, setNns] = useState(false);

const display = renderSection(section.content, song.tonic, song.mode, nns);

return (
  <>
    <button onClick={() => setNns(n => !n)}>
      {nns ? "Show Chords" : "Show Numbers"}
    </button>
    <pre>{display}</pre>
  </>
);
```

---

## Transposing to a different key

Transposing is just rendering in a different key. No changes to stored data needed.

```typescript
// Song written and stored in G — render in D for a specific musician
renderSection(section.content, "D", "major");
```

For setlists, use the setlist's key override:

```typescript
const tonic = setlistSong.tonic ?? song.tonic;
const mode  = setlistSong.mode  ?? song.mode;

renderSection(section.content, tonic, mode);
```

---

## Rendering minor keys

Pass `"minor"` as the mode. The library uses the natural minor scale by default — degree 5 renders as a minor chord.

```typescript
renderSection("[1m]word [4m]word [5m]word", "A", "minor");
// Am  Dm  Em
// word word word
```

### Harmonic minor (raised V)

Write `[5M]` (explicit major quality) to get the harmonic minor dominant — the raised V chord. `[5]` alone stays natural minor.

```typescript
renderSection("[5]word", "A", "minor");    // Em  ← natural minor v
renderSection("[5M]word", "A", "minor");   // E   ← harmonic V
```

---

## Borrowed chords

Write the chord with its explicit quality to override the scale default. This is how borrowed chords from the parallel minor are notated.

```typescript
// [4m] = borrowed iv chord (from parallel minor)
renderSection("[4m]word", "C", "major");  // Fm

// [b7] = borrowed bVII
renderSection("[b7]word", "G", "major");  // F
```

---

## Changing mode (major ↔ minor)

Mode is a render-time parameter, so you can render the same stored content in either mode. This is useful when a song can be played in parallel major or minor.

```typescript
const content = "[1]word [4]word [5]word";

renderSection(content, "A", "major");  // A  D  E
renderSection(content, "A", "minor");  // Am Dm Em
```

For a permanent mode change on a song, update `songs.mode` in your database. The stored NNS content doesn't change — only the render output does.

---

## Rendering a full song

Use `renderSong` when you have a `SongAST` (e.g. from `parseSong` during import). It renders all sections with their labels.

```typescript
import { parseSong, renderSong } from "@song-chart/scs";

const song = parseSong(chordProText, "G");

// Render in the song's own key
renderSong(song);

// Render in a different key
renderSong(song, "D");

// Render in NNS
renderSong(song, undefined, undefined, true);
```

Output format:

```
[Verse 1]
G           C    G         D
Amazing grace how sweet the sound

[Chorus]
G       C    G         D    G
Praise God from whom all blessings flow
```

---

## Rendering with NNS mode from the database

In a typical app, you fetch sections individually from the database and render them one at a time:

```typescript
async function getRenderedSection(sectionId: string, tonic: string, mode: string, nns: boolean) {
  const section = await db.sections.findById(sectionId);

  if (!tonic || !mode) {
    // NNS song with no key assigned — return raw numbers
    return renderSection(section.content, "C", "major", true);
  }

  return renderSection(section.content, tonic, mode as "major" | "minor", nns);
}
```
