import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join("C:", "Users", "Uday", "Downloads", "JS_DOM_MCQ_Chapters_11_to_20.md");
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
    .trim();
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

  while (i < lines.length) {
    const L = lines[i];
    if (/^-\s+[A-D]\)\s/.test(L)) break;
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
    if (L.trim() === "---") break;
    stem = stem ? stem + "\n" + L : L;
    i++;
  }

  stem = normalizeStem(stem);

  const options = [];
  while (i < lines.length && /^-\s+[A-D]\)\s/.test(lines[i])) {
    const m = lines[i].match(/^-\s+[A-D]\)\s*(.*)$/);
    if (m) options.push(m[1].trim());
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

for (let ch = 11; ch <= 20; ch++) {
  const n = out.filter((q) => q.chapter === ch).length;
  if (n !== 40) {
    console.error(`Chapter ${ch}: expected 40, got ${n}`);
    process.exit(1);
  }
}

const existing = JSON.parse(fs.readFileSync(mcqPath, "utf8"));
const lastCh = existing.length ? existing[existing.length - 1].chapter : 0;
if (lastCh !== 10) {
  console.error(`Expected mcqData.json to end at chapter 10, last chapter is ${lastCh}`);
  process.exit(1);
}

const merged = existing.concat(out);
fs.writeFileSync(mcqPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log(`Appended ${out.length} questions (ch.11–20). Total MCQs: ${merged.length}`);
