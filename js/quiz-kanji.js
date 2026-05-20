/* ═══════════════════════════════════════════════
   QUIZ KANJI N5
   Question types
     Type A: Show kanji → pick meaning
     Type B: Show kanji → pick onyomi reading
   Both show a KANJI as the question, so the big
   kanji display always makes sense visually.
═══════════════════════════════════════════════ */

const PREMIUM_TOTAL_K = 20;
const FREE_TOTAL_K = 5;

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

/* ── Shuffle (returns new array) ── */

function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Safe option builder ─────────────────────
   Uses object-based tracking so answerIndex is
   always correct regardless of duplicate strings.
──────────────────────────────────────────────── */

function _buildOptions(correct, wrongStrings) {
  // Remove any wrong that happens to equal the correct answer (prevent duplicates)
  const cleanWrongs = [...new Set(wrongStrings.filter((w) => w !== correct))];
  const picked = _shuffle(cleanWrongs).slice(0, 3);

  // Pad if fewer than 3 unique wrongs (edge case on small pools)
  while (picked.length < 3) picked.push("—");

  // Tag each option, then shuffle — track correctness by object identity
  const tagged = [
    { text: correct, ok: true },
    ...picked.map((t) => ({ text: t, ok: false })),
  ];
  const shuffled = _shuffle(tagged);

  return {
    options: shuffled.map((o) => o.text),
    answerIndex: shuffled.findIndex((o) => o.ok), // always accurate, no string comparison needed
  };
}

/* ── Type A: Kanji → Meaning ─────────────────
   Shows kanji (large) → user picks correct meaning.
   Sub-hint: onyomi/kunyomi shown below kanji.
──────────────────────────────────────────────── */

function _buildKanjiToMeaning(item, pool) {
  const lang = currentLang;
  const correct = lang === "id" ? item.id : item.en;
  const wrongPool = pool
    .filter((k) => k.kanji !== item.kanji)
    .map((k) => (lang === "id" ? k.id : k.en));

  const { options, answerIndex } = _buildOptions(correct, wrongPool);

  return {
    questionType: "A", // kanji is the question
    typeLabel: language[currentLang].quizKanjiQ1,
    questionBig: item.kanji, // large kanji display
    questionHint: `${item.on}  ·  ${item.kun}`, // reading below kanji
    options,
    answerIndex,
    optStyle: "meaning", // options are text → normal size
  };
}

/* ── Type B: Kanji → On'yomi ─────────────────
   Shows kanji (large) → user picks onyomi reading.
   Tests reading knowledge without the confusing
   "big meaning text" layout of the old type 2.
──────────────────────────────────────────────── */

function _buildKanjiToOnyomi(item, pool) {
  const correct = item.on; // onyomi string, e.g. "イチ・イツ"
  const wrongPool = pool.filter((k) => k.kanji !== item.kanji).map((k) => k.on);

  const { options, answerIndex } = _buildOptions(correct, wrongPool);

  return {
    questionType: "B",
    typeLabel: language[currentLang].quizKanjiQ2,
    questionBig: item.kanji,
    questionHint: (lang) => (lang === "id" ? item.id : item.en),
    options,
    answerIndex,
    optStyle: "reading", // options are katakana → slightly larger
  };
}

/* ── Generate question set ── */

function generateQuestions() {
  const total = isPremium() ? PREMIUM_TOTAL_K : FREE_TOTAL_K;
  const typeAn = Math.round(total * 0.6); // kanji → meaning
  const typeBn = total - typeAn; // kanji → onyomi

  const shuffled = _shuffle(kanjiN5);
  const questions = [];

  shuffled
    .slice(0, typeAn)
    .forEach((item) => questions.push(_buildKanjiToMeaning(item, kanjiN5)));
  shuffled
    .slice(typeAn, typeAn + typeBn)
    .forEach((item) => questions.push(_buildKanjiToOnyomi(item, kanjiN5)));

  return _shuffle(questions);
}

/* ── Render one question ── */

function renderQuizQuestion() {
  const t = language[currentLang];
  const q = quizQuestions[quizIndex];
  const tot = quizQuestions.length;

  // Progress bar & counter
  document.getElementById("quizCounter").textContent = t.quizCounter(
    quizIndex + 1,
    tot,
  );
  document.getElementById("quizFill").style.width =
    `${(quizIndex / tot) * 100}%`;

  // Type label (instruction text above question)
  document.getElementById("quizTypeLabel").textContent = q.typeLabel;

  // Big question display — always a kanji, so always fits the large font
  const bigEl = document.getElementById("quizJP");
  bigEl.textContent = q.questionBig;
  bigEl.className = "quiz-jp"; // always kanji → always the normal large style

  // Sub hint (reading hint for type A, meaning hint for type B)
  const hint =
    typeof q.questionHint === "function"
      ? q.questionHint(currentLang)
      : q.questionHint;
  document.getElementById("quizSub").textContent = hint;

  // Reset feedback
  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("quizFeedback").className = "quiz-feedback";
  document.getElementById("quizNext").classList.add("hidden");

  // Build option buttons
  const container = document.getElementById("quizOptions");
  container.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = `quiz-opt-btn${q.optStyle === "reading" ? " opt-reading" : ""}`;
    btn.textContent = opt;
    btn.addEventListener("click", () => answerQuiz(i));
    container.appendChild(btn);
  });

  quizAnswered = false;
}

/* ── Handle answer selection ── */

function answerQuiz(selectedIndex) {
  if (quizAnswered) return;
  quizAnswered = true;

  const t = language[currentLang];
  const q = quizQuestions[quizIndex];
  const hit = q.answerIndex === selectedIndex;
  if (hit) quizScore++;

  // Feedback text
  const fbEl = document.getElementById("quizFeedback");
  fbEl.textContent = hit ? t.quizCorrect : t.quizWrong;
  fbEl.className = `quiz-feedback ${hit ? "feedback-correct" : "feedback-wrong"}`;

  // Highlight buttons
  document.querySelectorAll(".quiz-opt-btn").forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answerIndex) btn.classList.add("opt-correct");
    else if (i === selectedIndex && !hit) btn.classList.add("opt-wrong");
  });

  document.getElementById("quizNext").classList.remove("hidden");
}

/* ── Navigation ── */

function nextQuestion() {
  quizIndex++;
  if (quizIndex >= quizQuestions.length) showResult();
  else renderQuizQuestion();
}

function showResult() {
  const t = language[currentLang];
  const tot = quizQuestions.length;
  const pct = Math.round((quizScore / tot) * 100);

  document.getElementById("quizPlay").classList.add("hidden");
  document.getElementById("quizResult").classList.remove("hidden");
  document.getElementById("quizFill").style.width = "100%";
  document.getElementById("quizScoreVal").textContent = `${quizScore} / ${tot}`;
  document.getElementById("quizScoreMsg").textContent = t.quizScoreMsg(
    quizScore,
    tot,
  );
  document.getElementById("quizGradeMsg").textContent = t.quizGrade(pct);
}

/* ── Start / retry ── */

function startQuiz() {
  quizQuestions = generateQuestions();
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;

  document.getElementById("quizStart").classList.add("hidden");
  document.getElementById("quizResult").classList.add("hidden");
  document.getElementById("quizPlay").classList.remove("hidden");
  document.getElementById("quizNext").classList.add("hidden");
  document.getElementById("quizFill").style.width = "0%";

  renderQuizQuestion();
}

function retryQuiz() {
  startQuiz();
}

/* ── Init ── */

window.addEventListener("DOMContentLoaded", () => {
  const t = language[currentLang];
  const noteEl = document.getElementById("quizFreeNote");
  if (noteEl) {
    const show = !isPremium();
    noteEl.style.display = show ? "block" : "none";
    if (show) noteEl.textContent = t.quizFreeNote;
  }
  document.querySelectorAll("[data-lang]").forEach((el) => {
    const key = el.dataset.lang;
    if (t[key] && typeof t[key] === "string") el.textContent = t[key];
  });
});
