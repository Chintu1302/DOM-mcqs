<script>
  import mcqs from "./mcqData.json";
  import {
    keyOf,
    shuffle,
    filterPool,
    stemToHtml,
    gradeQuiz,
  } from "./mcqUtils.js";

  /** @type {typeof mcqs} */
  const MCQS = mcqs;

  const CHAPTER_2_TITLE = "Selecting DOM Elements";
  const CHAPTER_3_TITLE = "Reading and Modifying Elements";

  /** Topic labels for Ch.2 — exact `chapterConcept` strings from mcqData.json */
  const SELECTING_DOM_TOPICS = [
    "getElementById",
    "getElementsByClassName",
    "getElementsByTagName",
    "querySelector",
    "querySelectorAll",
    "CSS selector syntax",
    "When to use which selector",
    "NodeList vs HTMLCollection vs Array",
    "Performance considerations",
  ];

  /** Topic labels for Ch.3 — order matches `chapterConcept` in mcqData.json */
  const READING_MODIFYING_TOPICS = [
    "textContent vs innerText vs innerHTML",
    "Reading element content",
    "Changing text content",
    "Changing HTML content",
    "Element attributes (setAttribute, getAttribute, removeAttribute)",
    "Direct property access (id, className, value)",
    "style property (inline styles)",
    "classList (add, remove, toggle, contains)",
    "Data attributes (dataset)",
  ];

  /** @type {'' | '1' | '2' | '3'} */
  let selectedChapter = $state("");
  /** `chapterConcept` substring when narrowing ch.2 or ch.3; empty means all topics in chapter */
  let selectedTopic = $state("");

  const chapterFocus = $derived.by(() => {
    const ch = selectedChapter;
    const t = selectedTopic;
    if (!ch) return "";
    if ((ch === "2" || ch === "3") && t) return ch + "|" + t;
    return ch;
  });

  let difficulty = $state("all");
  /** @type {typeof mcqs} */
  let activePool = $state([]);
  /** @type {Record<string, number>} */
  let selections = $state({});
  /** @type {{ correct: number; wrong: number; notAnswered: number; total: number; pct: number } | null} */
  let results = $state(null);

  function rebuildPool() {
    results = null;
    const base = filterPool(MCQS, chapterFocus, difficulty);
    if (base.length === 0) {
      activePool = [];
      selections = {};
      return;
    }
    activePool = shuffle(base);
    selections = {};
  }

  $effect(() => {
    void chapterFocus;
    void difficulty;
    rebuildPool();
  });

  function shuffleClick() {
    rebuildPool();
  }

  function submit() {
    results = gradeQuiz(activePool, selections);
  }

  /** @param {string} k @param {number} optIdx */
  function pick(k, optIdx) {
    selections = { ...selections, [k]: optIdx };
  }
</script>

<div class="wrap">
  <h1>JavaScript &amp; DOM — MCQ Quiz</h1>
  <p class="sub">
    Chapters 1–10 · Optional chapter focus · Difficulty · Submit to see score (no
    spoilers while you work).
  </p>

  <div class="toolbar">
    <div>
      <label for="chapter-focus">Chapter</label><br />
      <select
        id="chapter-focus"
        class="select-chapter"
        bind:value={selectedChapter}
        aria-label="Chapter focus"
        onchange={() => {
          selectedTopic = "";
        }}
      >
        <option value="">All chapters</option>
        <option value="1">Ch. 1 — HTML and the DOM Tree</option>
        <option value="2">Ch. 2 — Selecting DOM Elements</option>
        <option value="3">Ch. 3 — Reading and Modifying Elements</option>
      </select>
    </div>
    {#if selectedChapter === "2" || selectedChapter === "3"}
      <div class="topic-field">
        <label for="topic-focus"
          >Topic{#if selectedChapter === "2"} ({CHAPTER_2_TITLE}){:else} ({CHAPTER_3_TITLE}){/if}</label
        ><br />
        <select
          id="topic-focus"
          class="select-topic"
          bind:value={selectedTopic}
          aria-label="Topic within selected chapter"
        >
          <option value=""
            >All topics — {selectedChapter === "2" ? CHAPTER_2_TITLE : CHAPTER_3_TITLE}</option
          >
          {#if selectedChapter === "2"}
            {#each SELECTING_DOM_TOPICS as topic}
              <option value={topic}>{CHAPTER_2_TITLE} · {topic}</option>
            {/each}
          {:else}
            {#each READING_MODIFYING_TOPICS as topic}
              <option value={topic}>{CHAPTER_3_TITLE} · {topic}</option>
            {/each}
          {/if}
        </select>
      </div>
    {/if}
    <div>
      <label for="difficulty">Difficulty</label><br />
      <select id="difficulty" bind:value={difficulty} aria-label="Filter by difficulty">
        <option value="all">All questions</option>
        <option value="easy">Easy (Q1–10 per chapter)</option>
        <option value="medium">Medium (Q11–20)</option>
        <option value="hard">Hard (Q21–30)</option>
        <option value="coding">Coding (Q31–40)</option>
      </select>
    </div>
    <button type="button" class="secondary" onclick={shuffleClick}>Shuffle &amp; reset</button>
  </div>

  <div class="questions" aria-live="polite">
    {#if activePool.length === 0}
      <p class="sub empty-msg">
        No questions match these filters. Try “All chapters” or a different difficulty.
      </p>
    {:else}
      {#each activePool as q, idx (keyOf(q))}
        {@const k = keyOf(q)}
        <article class="q">
          <h2>Question {idx + 1}</h2>
          <div class="meta">
            {#if q.chapterTitle}{q.chapterTitle} · {/if}Ch. {q.chapter} · {q.difficulty} · #{q.questionNumberInChapter}{#if q.chapterConcept}
              · {q.chapterConcept}{/if}
          </div>
          <div class="stem">{@html stemToHtml(q.stem)}</div>
          <fieldset>
            <legend class="visually-hidden">Choose one answer</legend>
            {#each ["A", "B", "C", "D"] as letter, optIdx}
              <label class="opt">
                <input
                  type="radio"
                  name="q-{idx}"
                  checked={selections[k] === optIdx}
                  onchange={() => pick(k, optIdx)}
                />
                <span>{@html "<strong>" + letter + ".</strong> " + stemToHtml(q.options[optIdx])}</span>
              </label>
            {/each}
          </fieldset>
        </article>
      {/each}
    {/if}
  </div>

  <div class="actions">
    <button type="button" onclick={submit}>Submit answers</button>
  </div>

  {#if results}
    <div class="results visible" role="region" aria-label="Quiz results">
      <h3>Results</h3>
      <div class="stats">
        <div class="stat correct">
          <b>{results.correct}</b><span>Correct</span>
        </div>
        <div class="stat wrong">
          <b>{results.wrong}</b><span>Incorrect</span>
        </div>
        <div class="stat na">
          <b>{results.notAnswered}</b><span>Not answered</span>
        </div>
        <div class="stat score">
          <b>{results.correct} / {results.total}</b><span>Score</span>
        </div>
        <div class="stat score">
          <b>{results.pct}%</b><span>Percent correct</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    --bg: #0f1419;
    --surface: #1a2332;
    --border: #2d3a4d;
    --text: #e7eef8;
    --muted: #8b9cb3;
    --accent: #5b9fd4;
    --good: #3ecf8e;
    --bad: #e06c75;
    --warn: #e5c07b;
  }

  .wrap {
    max-width: 52rem;
    margin: 0 auto;
    padding: 1.25rem 1rem 4rem;
  }

  h1 {
    font-size: 1.35rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
    color: var(--text);
  }

  h2 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 0.75rem;
    color: #cbd6e6;
  }

  h3 {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
    color: var(--text);
  }

  .sub {
    color: var(--muted);
    font-size: 0.9rem;
    margin-bottom: 1.25rem;
  }

  .empty-msg {
    margin-top: 0.5rem;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--surface);
    border-radius: 10px;
    border: 1px solid var(--border);
  }

  label {
    font-size: 0.85rem;
    color: var(--muted);
  }

  select,
  button {
    font: inherit;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    padding: 0.45rem 0.75rem;
  }

  select {
    min-width: 10rem;
    max-width: 100%;
    cursor: pointer;
  }

  .topic-field {
    flex: 1 1 14rem;
    min-width: 0;
  }

  select.select-chapter {
    min-width: min(100%, 20rem);
  }

  select.select-topic {
    min-width: min(100%, 22rem);
    width: 100%;
  }

  button {
    cursor: pointer;
    background: var(--accent);
    color: #0a0e14;
    border-color: transparent;
    font-weight: 600;
  }

  button.secondary {
    background: var(--surface);
    color: var(--text);
    border-color: var(--border);
  }

  .questions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  article.q {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem 1.1rem;
  }

  .meta {
    font-size: 0.75rem;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .stem {
    margin-bottom: 0.85rem;
    font-size: 0.92rem;
    color: var(--text);
  }

  .stem :global(pre),
  .stem :global(code) {
    display: block;
    overflow-x: auto;
    background: #0a0e14;
    padding: 0.65rem;
    border-radius: 6px;
    font-size: 0.82rem;
    margin: 0.5rem 0 0;
  }

  fieldset {
    margin: 0;
    padding: 0;
    border: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .opt {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.35rem 0.4rem;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text);
  }

  .opt:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .opt input {
    margin-top: 0.2rem;
    accent-color: var(--accent);
  }

  .opt span {
    flex: 1;
    font-size: 0.88rem;
  }

  .opt span :global(pre),
  .opt span :global(code) {
    display: block;
    overflow-x: auto;
    background: #0a0e14;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.82rem;
    margin: 0.35rem 0 0;
  }

  .actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .results {
    display: none;
    margin-top: 1.5rem;
    padding: 1.25rem;
    background: var(--surface);
    border-radius: 10px;
    border: 1px solid var(--border);
  }

  .results.visible {
    display: block;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
    gap: 0.75rem;
  }

  .stat {
    padding: 0.75rem;
    background: #0a0e14;
    border-radius: 8px;
    text-align: center;
  }

  .stat b {
    display: block;
    font-size: 1.35rem;
  }

  .stat span {
    font-size: 0.78rem;
    color: var(--muted);
  }

  .stat.correct b {
    color: var(--good);
  }

  .stat.wrong b {
    color: var(--bad);
  }

  .stat.na b {
    color: var(--warn);
  }

  .stat.score b {
    color: var(--accent);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
