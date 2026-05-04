/** @typedef {{ chapter: number; questionNumberInChapter: number; difficulty: string; stem: string; options: string[]; correctIndices: number[]; chapterTitle?: string; chapterConcept?: string }} Mcq */

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Markdown-style ``` fences → safe HTML */
export function stemToHtml(stem) {
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let html = "";
  let m;
  while ((m = re.exec(stem)) !== null) {
    html += escapeHtml(stem.slice(last, m.index)).replace(/\n/g, "<br />\n");
    html += "<pre><code>" + escapeHtml(m[2]) + "</code></pre>";
    last = re.lastIndex;
  }
  html += escapeHtml(stem.slice(last)).replace(/\n/g, "<br />\n");
  return html;
}

/** @param {Mcq} q */
export function keyOf(q) {
  return q.chapter + "-" + q.questionNumberInChapter;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** @param {Mcq[]} mcqs */
export function filterPool(mcqs, chapterFocus, difficulty) {
  let pool = mcqs.slice();
  if (chapterFocus) {
    const pipe = chapterFocus.indexOf("|");
    const chPart = pipe === -1 ? chapterFocus : chapterFocus.slice(0, pipe);
    const conceptPart = pipe === -1 ? "" : chapterFocus.slice(pipe + 1);
    const n = parseInt(chPart, 10);
    pool = pool.filter((q) => q.chapter === n);
    if (conceptPart) {
      pool = pool.filter((q) => q.chapterConcept === conceptPart);
    }
  }
  if (difficulty !== "all") {
    pool = pool.filter((q) => q.difficulty === difficulty);
  }
  return pool;
}

/** @param {Mcq[]} activePool @param {Record<string, number>} selections */
export function gradeQuiz(activePool, selections) {
  let correct = 0;
  let wrong = 0;
  let notAnswered = 0;
  /** @param {Mcq} q */
  const correctSet = (q) => {
    const arr = q.correctIndices;
    return new Set(Array.isArray(arr) ? arr : [arr]);
  };
  for (const q of activePool) {
    const k = keyOf(q);
    const sel = selections[k];
    const ok = correctSet(q);
    if (sel === undefined || sel === null) {
      notAnswered++;
    } else if (ok.has(sel)) {
      correct++;
    } else {
      wrong++;
    }
  }
  const total = activePool.length;
  const pct = total ? Math.round((correct / total) * 1000) / 10 : 0;
  return { correct, wrong, notAnswered, total, pct };
}
