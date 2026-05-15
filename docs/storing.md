# Storing Songs

## Recommended database schema

```sql
songs (
  id,
  title,
  nns     BOOLEAN NOT NULL DEFAULT false,
  tonic   TEXT,    -- e.g. "G", "Bb", "C#" — null for NNS-only songs with no home key
  mode    TEXT,    -- "major" or "minor" — null for NNS-only songs with no home key
  ...
)

sections (
  id,
  song_id,
  label        TEXT,    -- "Verse", "Chorus", etc. — empty string if unlabeled
  order_index  INTEGER,
  content      TEXT     -- NNS/SCS string, e.g. "[1]Amazing [4]grace"
)

setlist_songs (
  id,
  setlist_id,
  song_id,
  tonic   TEXT,    -- overrides song.tonic for this setlist (nullable)
  mode    TEXT,    -- overrides song.mode for this setlist (nullable)
  order_index INTEGER
)
```

`sections.content` is always stored in NNS/SCS degree format regardless of how the user wrote the song. This is the single source of truth.

---

## Saving a section

### From key-based input

```typescript
import { chordProToSCS, SCSError } from "@song-chart/scs";

async function saveSection(songId: string, label: string, userInput: string, tonic: string, mode: "major" | "minor") {
  try {
    const content = chordProToSCS(userInput, tonic, mode);
    await db.sections.upsert({ song_id: songId, label, content });
  } catch (e) {
    if (e instanceof SCSError) {
      throw new UserFacingError(`Invalid chord "${e.input}" — please check your input.`);
    }
    throw e;
  }
}
```

### From NNS input

```typescript
async function saveNNSSection(songId: string, label: string, userInput: string) {
  // NNS is already in the correct storage format
  await db.sections.upsert({ song_id: songId, label, content: userInput });
}
```

---

## Updating a section

Updating works the same as saving — convert the new input and overwrite `content`. Because the stored format is always NNS, there's no migration needed when a user changes a chord.

```typescript
async function updateSection(sectionId: string, userInput: string, tonic: string, mode: "major" | "minor") {
  const content = chordProToSCS(userInput, tonic, mode);
  await db.sections.update({ id: sectionId, content });
}
```

---

## Changing a song's key or mode

When a user changes the song's `tonic` or `mode`, **you do not need to re-save the sections**. The stored NNS content is key-independent — the new key only affects rendering.

```typescript
// Just update the song metadata
await db.songs.update({ id: songId, tonic: "D", mode: "major" });

// Sections stay exactly as they are — they render correctly in the new key automatically
```

The exception: if you have section content that was saved with a specific `targetMode` (parallel mode conversion), changing the mode would require re-converting. This is an uncommon case.

---

## Exporting a full song

Use `serializeSong` to export a complete song as a single SCS-format string — useful for backup, sharing, or API responses.

```typescript
import { parseSong, serializeSong } from "@song-chart/scs";

// Build a SongAST from your DB records, then serialize
const song = parseSong(chordProSource, tonic, mode);
const exported = serializeSong(song);
```

The output format:

```
{title: Amazing Grace}
{key: G}

{comment: Verse 1}
[1]Amazing [4]grace [5]how sweet the sound

{comment: Chorus}
[1]Praise [4]God from [1]whom all [5]blessings [1]flow
```

> **Note:** `serializeSong` outputs SCS degree notation (numbers), not ChordPro note names. To re-import the output, use `parseSection` per section rather than `parseSong` (which expects ChordPro note names as input).
