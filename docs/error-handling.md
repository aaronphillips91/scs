# Error Handling & Validation

## SCSError

All library functions throw `SCSError` when given invalid input. It extends the standard `Error` class with one extra field:

```typescript
class SCSError extends Error {
  message: string;  // human-readable description
  input?: string;   // the specific value that caused the error
}
```

Import it alongside your other library functions:

```typescript
import { chordProToSCS, renderSection, SCSError } from "@song-chart/scs";
```

---

## When errors are thrown

| Scenario | Example | Error message |
|----------|---------|---------------|
| Unrecognized note name | `[Xyz]` | `Invalid chord: Xyz` |
| Invalid text after note | `[Eggs]` | `Invalid chord: Eggs` |
| Invalid key | `renderSection(..., "Q", "major")` | `Invalid key: Q` |
| Invalid SCS token | `[8]` | `Invalid chord token: 8` |
| Conflicting modifiers | `[1sus2sus4]` | `Invalid chord: cannot contain both sus2 and sus4` |
| Invalid bass note | `[G/Xyz]` | `Invalid bass note: Xyz` |

---

## Catching errors at save time

Wrap `chordProToSCS` calls when processing user input. The `input` field on the error tells you exactly which chord failed.

```typescript
try {
  const content = chordProToSCS(userInput, tonic, mode);
  await saveSection(content);
} catch (e) {
  if (e instanceof SCSError) {
    const detail = e.input ? `"${e.input}"` : "";
    showError(`Invalid chord ${detail} — please check your input.`);
  } else {
    throw e; // unexpected — rethrow for your error logger
  }
}
```

---

## Catching errors at render time

Render errors are rarer (stored content should already be valid), but worth guarding against — for example, if a `tonic` value is somehow missing or malformed.

```typescript
try {
  return renderSection(section.content, tonic, mode);
} catch (e) {
  if (e instanceof SCSError) {
    console.error("Render failed:", e.message);
    return section.content; // fallback: show raw NNS
  }
  throw e;
}
```

---

## Validating input before saving

`validateChord` takes a parsed `ChordNode` and returns a result object with `errors` and `warnings` arrays. To validate a raw string token, first parse it with `parseChord` (which throws an `SCSError` if the token is structurally invalid), then pass the result to `validateChord`.

```typescript
import { parseChord, validateChord, SCSError } from "@song-chart/scs";

function validateToken(token: string) {
  try {
    const chord = parseChord(token);
    return validateChord(chord);
    // → { valid: boolean, errors: string[], warnings: string[] }
  } catch (e) {
    if (e instanceof SCSError) {
      return { valid: false, errors: [e.message], warnings: [] };
    }
    throw e;
  }
}

validateToken("4m");       // { valid: true, errors: [], warnings: [] }
validateToken("8");        // { valid: false, errors: ["Invalid chord token: 8"], warnings: [] }
validateToken("1sus2sus4") // { valid: true, errors: [], warnings: ["sus2 and sus4 conflict"] }
```

Note that **warnings** indicate musically suspect but structurally valid chords (e.g. conflicting modifiers). **Errors** mean the chord cannot be used.

---

## Real-time validation in an editor

For live feedback as the user types, extract chord tokens from the input string and validate each one:

```tsx
import { parseChord, validateChord, SCSError } from "@song-chart/scs";

function getInvalidChords(input: string): string[] {
  const tokens = [...input.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]!);
  return tokens.filter(token => {
    try {
      const chord = parseChord(token);
      return !validateChord(chord).valid;
    } catch {
      return true; // parse failed = invalid
    }
  });
}

// React component
function ChordInput({ value, onChange }) {
  const invalid = getInvalidChords(value);

  return (
    <>
      <textarea value={value} onChange={e => onChange(e.target.value)} />
      {invalid.length > 0 && (
        <p className="error">Invalid chords: {invalid.join(", ")}</p>
      )}
    </>
  );
}
```

---

## Pattern: validate on keystroke, guard on save

```typescript
// On each keystroke — fast, no side effects
const invalid = getInvalidChords(userInput);
setValidationErrors(invalid);

// On save — authoritative
if (invalid.length === 0) {
  try {
    const content = chordProToSCS(userInput, tonic, mode);
    await saveSection(content);
  } catch (e) {
    if (e instanceof SCSError) {
      showError(e.message);
    } else throw e;
  }
}
```
