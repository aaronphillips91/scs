# Chord Syntax Reference

The library works with two chord formats: **ChordPro** (what users type) and **SCS** (what gets stored). Understanding both helps when building input UIs and debugging stored content.

---

## ChordPro format (user input)

Chords are written inline with lyrics using square brackets: `[ChordName]lyrics`.

```
[G]Amazing [C]grace [D]how sweet the [G]sound
```

### Note names

Standard note letters, case-sensitive. Must be uppercase.

| Valid | Invalid |
|-------|---------|
| `A B C D E F G` | `a b c d e f g` |
| `Ab Bb Eb Gb Cb` | `AB BB` |
| `A# C# D# F# G#` | `a#` |

### Quality suffixes

Appended directly after the note name, no space.

| Suffix | Meaning | Example |
|--------|---------|---------|
| *(none)* | Major | `[G]` → G major |
| `m` | Minor | `[Am]` → A minor |
| `dim` or `°` | Diminished | `[Bdim]` or `[B°]` |
| `aug` or `+` | Augmented | `[Caug]` or `[C+]` |

### Modifiers

Appended after the quality suffix.

| Modifier | Example | Notes |
|----------|---------|-------|
| `7` | `[G7]` | Dominant 7th |
| `maj7` | `[Gmaj7]` | Major 7th |
| `9` | `[C9]` |  |
| `11` | `[F11]` |  |
| `13` | `[G13]` |  |
| `6` | `[A6]` |  |
| `add9` | `[Gadd9]` |  |
| `sus4` | `[Gsus4]` | Also `sus` as shorthand |
| `sus2` | `[Gsus2]` |  |

Modifiers can be combined: `[Gsus4]`, `[Cmaj7]`, `[Am7]`.

`sus2` and `sus4` cannot be combined together. `maj7` and `7` cannot be combined together.

### Slash chords

Bass note written after a `/`.

```
[G/B]    [D/F#]    [C/E]    [Am/E]
```

### Full examples

```
[G]      [Am]     [Cmaj7]   [Dsus4]
[Bm7]    [F#m]    [Bb]      [Eb/G]
[G/B]    [D/F#]   [Cadd9]   [E7]
```

---

## SCS format (stored in database)

SCS uses **scale degrees** (1–7) instead of note names. This is what `sections.content` holds in your database, and what `chordProToSCS` produces.

```
[1]Amazing [4]grace [5]how sweet the [1]sound
```

### Numbering convention

SCS uses **mode-relative** numbering: degrees are positions in the *active mode's* scale, not the major scale. In a major-key song `[6]` is the diatonic vi (a minor chord). In a minor-key song `[6]` is the natural-minor VI (a major chord). This keeps minor-key songs clean — every diatonic chord is a bare number — without needing flats everywhere.

Mode is fixed at song creation (via the `{key:}` directive) and does not change. A song written in G major stays in G major; a song written in A minor stays in A minor. There is no major↔minor conversion.

Bare numbers infer their quality from the mode (e.g. `[6]` in major = minor, `[6]` in minor = major). Explicit quality (`[6m]`, `[6M]`) overrides the inference for borrowed chords. When the explicit quality matches the inferred default it is omitted on serialization — `Em` in G major is stored as `[6]`, not `[6m]`.

> **Alternate display style — Nashville session notation.** Some users (Nashville-trained players, session musicians) prefer notation where degree numbers are always relative to the tonic's *major* scale, with minor-key diatonic chords spelled `[b3]`, `[b6]`, `[b7]`. SCS supports this as a one-way display via `renderSongAsNashville` / `renderSectionAsNashville` / `renderChordNashville`. Storage stays mode-relative; the Nashville form is for export and display only.

### Degree numbers

`1` through `7`, representing positions in the active mode's scale.

| Degree | C major | A minor |
|--------|---------|---------|
| `1` | C | Am |
| `2` | Dm | Bdim |
| `3` | Em | C |
| `4` | F | Dm |
| `5` | G | Em |
| `6` | Am | F |
| `7` | Bdim | G |

### Accidentals

Prefix the degree with `b` (flat) or `#` (sharp) for non-diatonic chords.

| Token | Meaning (in C major) |
|-------|----------------------|
| `[b3]` | Eb — borrowed bIII |
| `[b7]` | Bb — borrowed bVII |
| `[#4]` | F# — Lydian #IV |
| `[b6]` | Ab — borrowed bVI |

### Quality suffixes

Same as ChordPro, but `dim`/`aug` are stored as `°`/`+`. The quality suffix is omitted on serialization when it matches the mode-inferred default; it is emitted explicitly for borrowed chords whose quality differs from the default.

In a **major** key, the inferred defaults are:

| Degree | Default | Bare token  | Explicit-borrowed token |
|--------|---------|-------------|--------------------------|
| 1      | major   | `[1]` = I   | `[1m]` = i (borrowed)    |
| 2      | minor   | `[2]` = ii  | `[2M]` = II (borrowed)   |
| 3      | minor   | `[3]` = iii | `[3M]` = III (borrowed)  |
| 4      | major   | `[4]` = IV  | `[4m]` = iv (borrowed)   |
| 5      | major   | `[5]` = V   | `[5m]` = v (borrowed)    |
| 6      | minor   | `[6]` = vi  | `[6M]` = VI (borrowed)   |
| 7      | dim     | `[7]` = vii°| `[7M]` = VII (borrowed)  |

In a **minor** key, the defaults follow the natural-minor diatonic qualities:

| Degree | Default | Bare token  | Explicit-borrowed token |
|--------|---------|-------------|--------------------------|
| 1      | minor   | `[1]` = i   | `[1M]` = I (Picardy)     |
| 2      | dim     | `[2]` = ii° | `[2m]` (etc.)            |
| 3      | major   | `[3]` = III | `[3m]`                   |
| 4      | minor   | `[4]` = iv  | `[4M]`                   |
| 5      | minor   | `[5]` = v   | `[5M]` = V (harmonic)    |
| 6      | major   | `[6]` = VI  | `[6m]`                   |
| 7      | major   | `[7]` = VII | `[7m]`                   |

Accidental degrees (`[b3]`, `[#4]`, etc.) are non-diatonic by construction; their inferred default is **major** regardless of mode.

### Modifiers and slash chords

Identical to ChordPro, except the bass is also a degree number.

| SCS | Meaning (in G major) |
|-----|----------------------|
| `[1sus4]` | Gsus4 |
| `[5/7]` | D/F# (5th chord, bass on raised 7th of scale = F#) |
| `[4/1]` | C/G (4th chord, bass on root = G) |
| `[1maj7]` | Gmaj7 |
| `[6m7]` | Em7 |

### Full SCS examples

```
[1]      [6]      [1maj7]   [5sus4]
[6m7]    [3]      [b7]      [4/1]
[5/7]    [b3]     [1add9]   [2m7]
```

---

## Flat vs. sharp spelling

The library automatically chooses flat or sharp note names when rendering based on the key — you never need to specify this.

**Keys that render with flats:**

| Major | Minor |
|-------|-------|
| F Bb Eb Ab Db Gb Cb | Dm Gm Cm Fm Bbm Ebm Abm |

**Keys that render with sharps:**

| Major | Minor |
|-------|-------|
| C G D A E B F# | Am Em Bm F#m C#m G#m D#m |

For example, the `b3` degree in G major renders as `Bb`, but in D major it renders as `F#` — both are the same pitch, spelled correctly for the key.

---

## Known limitations

- **Secondary dominants** — `V/V` and other secondary dominant relationships are not yet resolved automatically. The chord is stored and rendered but its function is not annotated.
- **Melodic minor** — not supported. Natural minor is used by default; harmonic minor is available via explicit `[5M]`.
- **Quarter tones / microtonal** — not supported.
