import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join("C:", "Users", "Uday", "Downloads", "JS_DOM_MCQ_Chapters_31_to_40.md");
const mcqPath = path.join(__dirname, "..", "src", "lib", "mcqData.json");

const ANSWER = { A: 0, B: 1, C: 2, D: 3 };

function difficultyForQ(n) {
  if (n <= 10) return "easy";
  if (n <= 20) return "medium";
  if (n <= 30) return "hard";
  return "coding";
}

function normalizeStem(s) {
  return s
    .replace(/```js\n/g, "```javascript\n")
    .replace(/```js$/gm, "```javascript")
    .replace(/```jsx\n/g, "```javascript\n")
    .replace(/```tsx\n/g, "```javascript\n")
    .trim();
}

/** @param {string} line @param {boolean} inFence */
function isOptionStart(line, inFence) {
  if (inFence) return false;
  return /^[A-D]\)\s+/.test(line) || /^-\s+[A-D]\)\s+/.test(line);
}

/** @param {string} line */
function optionText(line) {
  let m = line.match(/^-\s+[A-D]\)\s*(.*)$/);
  if (m) return m[1].trim();
  m = line.match(/^[A-D]\)\s*(.*)$/);
  return m ? m[1].trim() : "";
}

const text = fs.readFileSync(mdPath, "utf8");
const lines = text.split(/\r?\n/);

/** @type {{ num: number; title: string } | null} */
let currentChapter = null;
/** @type {object[]} */
const out = [];

for (let i = 0; i < lines.length; i++) {
  const chMatch = lines[i].match(/^# Chapter (\d+): (.+)$/);
  if (chMatch) {
    currentChapter = { num: parseInt(chMatch[1], 10), title: chMatch[2].trim() };
    continue;
  }

  const qMatch = lines[i].match(/^\*\*Q(\d+)\.\*\*\s*(.*)$/);
  if (!qMatch || !currentChapter) continue;

  const qNum = parseInt(qMatch[1], 10);
  let stem = (qMatch[2] || "").replace(/\s+$/, "");
  i++;

  let inFence = false;
  while (i < lines.length) {
    const L = lines[i];
    const trimmed = L.trim();

    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      stem = stem ? stem + "\n" + L : L;
      i++;
      continue;
    }
    if (isOptionStart(L, inFence)) break;
    if (L.startsWith("###")) {
      i++;
      continue;
    }
    if (/^\*\*Q\d+\./.test(L)) {
      i--;
      break;
    }
    if (/^# Chapter \d+:/.test(L)) {
      i--;
      break;
    }
    if (trimmed === "---") break;
    stem = stem ? stem + "\n" + L : L;
    i++;
  }

  stem = normalizeStem(stem.trim());

  const options = [];
  while (i < lines.length && isOptionStart(lines[i], false)) {
    const t = optionText(lines[i]);
    options.push(t);
    i++;
  }

  while (i < lines.length && lines[i].trim() === "") i++;

  let correctIdx = null;
  if (i < lines.length) {
    const am = lines[i].match(/\*\*Answer:\s*([A-D])\*\*/i);
    if (am) correctIdx = ANSWER[am[1].toUpperCase()];
  }

  while (
    i < lines.length &&
    lines[i].trim() !== "---" &&
    !/^\*\*Q\d+\./.test(lines[i]) &&
    !/^# Chapter \d+:/.test(lines[i])
  ) {
    i++;
  }

  if (options.length !== 4 || correctIdx === null) {
    console.error(
      `Parse error Ch.${currentChapter?.num} Q${qNum}: options=${options.length} correct=${correctIdx}`,
    );
    process.exit(1);
  }

  out.push({
    chapter: currentChapter.num,
    chapterTitle: currentChapter.title,
    questionNumberInChapter: qNum,
    stem,
    options,
    correctIndices: [correctIdx],
    difficulty: difficultyForQ(qNum),
  });
}

if (out.length !== 400) {
  console.error(`Expected 400 questions, got ${out.length}`);
  process.exit(1);
}

for (let ch = 31; ch <= 40; ch++) {
  const n = out.filter((q) => q.chapter === ch).length;
  if (n !== 40) {
    console.error(`Chapter ${ch}: expected 40, got ${n}`);
    process.exit(1);
  }
}

const existing = JSON.parse(fs.readFileSync(mcqPath, "utf8"));
const last = existing[existing.length - 1];
if (!last || last.chapter !== 30) {
  console.error(`Expected mcqData.json to end at chapter 30, last chapter is ${last?.chapter}`);
  process.exit(1);
}

const merged = existing.concat(out);
fs.writeFileSync(mcqPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${out.length} questions (ch.31–40). Total MCQs: ${merged.length}`);
