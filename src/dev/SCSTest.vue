<template>
  <div class="page">
    <h1>SCS Test Harness</h1>

    <!-- Input Card -->
    <div class="card">
      <h2>Input</h2>

      <div class="controls">
        <label class="field">
          <span>Key</span>
          <select v-model="key">
            <option v-for="k in KEYS" :key="k" :value="k">{{ k }}</option>
          </select>
        </label>

        <label class="field">
          <span>Mode</span>
          <select v-model="mode">
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </label>

        <label class="field toggle">
          <span>NNS</span>
          <button
            class="toggle-btn"
            :class="{ active: nns }"
            @click="nns = !nns"
          >
            {{ nns ? 'On' : 'Off' }}
          </button>
        </label>
      </div>

      <textarea
        v-model="input"
        placeholder="[G]Amazing [C]grace [D]how sweet the sound"
        rows="6"
        spellcheck="false"
      />

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button @click="save">Save</button>
        <button @click="render" :disabled="!stored">Render</button>
      </div>
    </div>

    <!-- Stored Card -->
    <div v-if="stored" class="card">
      <h2>Stored <span class="badge">NNS / SCS</span></h2>
      <pre>{{ stored }}</pre>
    </div>

    <!-- Rendered Card -->
    <div v-if="rendered" class="card">
      <h2>
        Rendered
        <span class="badge">{{ nns ? 'NNS' : `${key} ${mode}` }}</span>
      </h2>
      <pre>{{ rendered }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const { chordProToSCS, renderSection, SCSError } = useChords()

const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const input  = ref('')
const key    = ref('G')
const mode   = ref<'major' | 'minor'>('major')
const nns    = ref(false)

const stored   = ref<string | null>(null)
const rendered = ref<string | null>(null)
const error    = ref<string | null>(null)

function save() {
  error.value    = null
  rendered.value = null

  if (nns.value) {
    stored.value = input.value.trim()
    return
  }

  try {
    stored.value = chordProToSCS(input.value.trim(), key.value, mode.value)
  } catch (e) {
    if (e instanceof SCSError) {
      error.value = e.input ? `Invalid chord: "${e.input}"` : e.message
    } else throw e
  }
}

function render() {
  if (!stored.value) return
  error.value = null

  try {
    rendered.value = renderSection(stored.value, key.value, mode.value, nns.value)
  } catch (e) {
    if (e instanceof SCSError) {
      error.value = e.message
    } else throw e
  }
}
</script>

<style scoped>
* {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  box-sizing: border-box;
}

.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
}

.controls {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

select {
  font-family: inherit;
  font-size: 0.875rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.toggle-btn {
  font-family: inherit;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  color: #64748b;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.toggle-btn.active {
  background: #1e293b;
  color: #fff;
  border-color: #1e293b;
}

textarea {
  font-family: inherit;
  font-size: 0.875rem;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  resize: vertical;
  width: 100%;
  line-height: 1.6;
  color: #1e293b;
}

textarea:focus {
  outline: none;
  border-color: #94a3b8;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

button {
  font-family: inherit;
  font-size: 0.875rem;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
}

button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  opacity: 0.85;
}

pre {
  margin: 0;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.8;
  white-space: pre;
  overflow-x: auto;
  color: #1e293b;
}

.badge {
  font-size: 0.7rem;
  font-weight: 500;
  background: #f1f5f9;
  color: #64748b;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.error {
  margin: 0;
  font-size: 0.8rem;
  color: #dc2626;
}
</style>
