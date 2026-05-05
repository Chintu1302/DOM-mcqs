<script>
  import mcqs from "./mcqData.json";
  import {
    keyOf,
    shuffle,
    shuffleQuestionOptions,
    filterPool,
    stemToHtml,
    gradeQuiz,
  } from "./mcqUtils.js";

  /** @type {typeof mcqs} */
  const MCQS = mcqs;

  /** [chapterNumber, title] — matches `chapterTitle` in mcqData.json */
  const CHAPTER_OPTIONS = [
    [1, "HTML and the DOM Tree"],
    [2, "Selecting DOM Elements"],
    [3, "Reading and Modifying Elements"],
    [4, "Creating and Removing Elements"],
    [5, "Event Handling Basics"],
    [6, "Form Handling and Validation"],
    [7, "Dynamic Lists and Conditional Display"],
    [8, "Building a Todo App (Vanilla JS)"],
    [9, "The Call Stack and Event Loop"],
    [10, "Callbacks and Asynchronous Patterns"],
    [11, "Promises"],
    [12, "Async/Await"],
    [13, "Fetch API and HTTP Requests"],
    [14, "Building a Data-Driven App"],
    [15, "The Problem with Manual DOM Manipulation"],
    [16, "String Templates and Parsing"],
    [17, "Template Syntax Design"],
    [18, "Template Parser (Lexer and AST)"],
    [19, "Template Compiler (AST to JavaScript)"],
    [20, "Rendering System V1"],
    [21, "The Reactivity Problem"],
    [22, "Reactive Variables (Getters/Setters)"],
    [23, "Dependency Tracking"],
    [24, "Efficient Updates (Fine-Grained Reactivity)"],
    [25, "Batching and Scheduling Updates"],
    [26, "Component Concept"],
    [27, "Props (Parent to Child Communication)"],
    [28, "Events (Child to Parent Communication)"],
    [29, "Slots (Content Projection)"],
    [30, "Component Lifecycle"],
    [31, "Component Composition Patterns"],
    [32, "Local State vs Shared State"],
    [33, "Store Pattern (Observable State)"],
    [34, "Context API"],
    [35, "State Management Patterns"],
    [36, "Client-Side Routing"],
    [37, "Transitions and Animations"],
    [38, "Virtual DOM (Comparison)"],
    [39, "SSR and Hydration"],
    [40, "Build Tools and Production"],
  ];

  /** @type {string} */
  let chapterFocus = $state("");

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
    const keepChapterDifficultyOrder = Boolean(chapterFocus) && difficulty !== "all";
    const ordered = keepChapterDifficultyOrder
      ? base.slice().sort((a, b) => a.questionNumberInChapter - b.questionNumberInChapter)
      : shuffle(base);
    activePool = ordered.map((q) => shuffleQuestionOptions(q));
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
    Chapters 1–40 · Optional chapter focus · Difficulty · Submit to see score (no
    spoilers while you work).
  </p>

  <div class="toolbar">
    <div>
      <label for="chapter-focus">Chapter</label><br />
      <select
        id="chapter-focus"
        class="select-chapter"
        bind:value={chapterFocus}
        aria-label="Chapter focus"
      >
        <option value="">All chapters</option>
        {#each CHAPTER_OPTIONS as [num, title]}
          <option value={String(num)}>Ch. {num} — {title}</option>
        {/each}
      </select>
    </div>
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
                <span class="opt-body">
                  <span>{@html "<strong>" + letter + ".</strong> " + stemToHtml(q.options[optIdx])}</span>
                  {#if results}
                    {#if (Array.isArray(q.correctIndices) ? q.correctIndices : [q.correctIndices]).includes(optIdx)}
                      <span class="option-feedback correct">✓ Correct option</span>
                    {:else if selections[k] === optIdx}
                      <span class="option-feedback wrong">✗ Your answer is incorrect</span>
                    {/if}
                  {/if}
                </span>
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

  select.select-chapter {
    min-width: min(100%, 28rem);
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

  .opt-body {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
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

  .option-feedback {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .option-feedback.correct {
    color: var(--good);
  }

  .option-feedback.wrong {
    color: var(--bad);
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
