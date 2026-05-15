import { chordProToSCS } from "../import/chordPro";
import { renderSection } from "../renderer/renderSection";
import { SCSError } from "../errors";

// ── User input ────────────────────────────────────────────────────────────────

const originalKey = "E";
const originalMode = "major";

const userInput = `
Bless the [A]Lord O my [E]soul [B/D#]O my [C#m]soul
Wo[A]rship His h[E]oly n[Bsus]ame
Sing like [A]never be[C#m]fore O [B]my [C#m]soul
I'll w[A]orship Your h[B]oly n[A/E]ame
`;

console.log("\n=== USER INPUT ===\n");
console.log(userInput.trim());

// ── Simulate saving to the database (convert to SCS/NNS) ─────────────────────

let stored: string | null = null;

try {
  stored = chordProToSCS(userInput.trim(), originalKey, originalMode as "major" | "minor");
  console.log("\n=== STORED (SCS/NNS) ===\n");
  console.log(stored);
} catch (e) {
  if (e instanceof SCSError) {
    console.error(`\n[Save error] ${e.message}${e.input ? ` — input: "${e.input}"` : ""}`);
  } else {
    throw e;
  }
}

// ── Simulate fetching and rendering ──────────────────────────────────────────

const renderKey = "G";
const renderMode = "major";
const nns = false; // set to true for NNS display

if (stored) {
  try {
    const rendered = renderSection(stored, renderKey, renderMode as "major" | "minor", nns);
    const label = nns ? "NNS" : `${renderKey} ${renderMode}`;
    console.log(`\n=== RENDERED (${label}) ===\n`);
    console.log(rendered);
  } catch (e) {
    if (e instanceof SCSError) {
      console.error(`\n[Render error] ${e.message}${e.input ? ` — input: "${e.input}"` : ""}`);
    } else {
      throw e;
    }
  }
}
