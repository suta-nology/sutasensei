/* ── QUIZ KANJI N4 ── uses kanjiN4[] from data.js */

const PREMIUM_TOTAL_K = 25;
const FREE_TOTAL_K = 5;

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _buildOptions(correct, wrongStrings) {
  const cleanWrongs = [...new Set(wrongStrings.filter((w) => w !== correct))];
  const picked = _shuffle(cleanWrongs).slice(0, 3);

  while (picked.length < 3) picked.push("—");

  const tagged = [
    { text: correct, ok: true },
    ...picked.map((t) => ({ text: t, ok: false })),
  ];
  const shuffled = _shuffle(tagged);

  return {
    options: shuffled.map((o) => o.text),
    answerIndex: shuffled.findIndex((o) => o.ok),
  };
}

function _buildKanjiToMeaning(item, pool) {
  const lang = currentLang;
  const correct = lang === "id" ? item.id : item.en;
  const wrongPool = pool
    .filter((k) => k.kanji !== item.kanji)
    .map((k) => (lang === "id" ? k.id : k.en));

  const { options, answerIndex } = _buildOptions(correct, wrongPool);

  return {
    questionType: "A",
    typeLabel: language[currentLang].quizKanjiQ1,
    questionBig: item.kanji,
    questionHint: `${item.on}  ·  ${item.kun}`,
    options,
    answerIndex,
    optStyle: "meaning",
  };
}

function _buildKanjiToOnyomi(item, pool) {
  const correct = item.on;
  const wrongPool = pool.filter((k) => k.kanji !== item.kanji).map((k) => k.on);

  const { options, answerIndex } = _buildOptions(correct, wrongPool);

  return {
    questionType: "B",
    typeLabel: language[currentLang].quizKanjiQ2,
    questionBig: item.kanji,
    questionHint: (lang) => (lang === "id" ? item.id : item.en),
    options,
    answerIndex,
    optStyle: "reading",
  };
}

function generateQuestions() {
  const total = isPremium() ? PREMIUM_TOTAL_K : FREE_TOTAL_K;
  const typeAn = Math.round(total * 0.6);
  const typeBn = total - typeAn;

  const shuffled = _shuffle(kanjiN4);
  const questions = [];

  shuffled
    .slice(0, typeAn)
    .forEach((item) => questions.push(_buildKanjiToMeaning(item, kanjiN4)));
  shuffled
    .slice(typeAn, typeAn + typeBn)
    .forEach((item) => questions.push(_buildKanjiToOnyomi(item, kanjiN4)));

  return _shuffle(questions);
}

function renderQuizQuestion() {
  const t = language[currentLang];
  const q = quizQuestions[quizIndex];
  const tot = quizQuestions.length;

  document.getElementById("quizCounter").textContent = t.quizCounter(
    quizIndex + 1,
    tot,
  );
  document.getElementById("quizFill").style.width =
    `${(quizIndex / tot) * 100}%`;

  document.getElementById("quizTypeLabel").textContent = q.typeLabel;

  const bigEl = document.getElementById("quizJP");
  bigEl.textContent = q.questionBig;
  bigEl.className = "quiz-jp";

  const hint =
    typeof q.questionHint === "function"
      ? q.questionHint(currentLang)
      : q.questionHint;
  document.getElementById("quizSub").textContent = hint;

  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("quizFeedback").className = "quiz-feedback";
  document.getElementById("quizNext").classList.add("hidden");

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

function answerQuiz(selectedIndex) {
  if (quizAnswered) return;
  quizAnswered = true;

  const t = language[currentLang];
  const q = quizQuestions[quizIndex];
  const hit = q.answerIndex === selectedIndex;
  if (hit) quizScore++;

  const fbEl = document.getElementById("quizFeedback");
  fbEl.textContent = hit ? t.quizCorrect : t.quizWrong;
  fbEl.className = `quiz-feedback ${hit ? "feedback-correct" : "feedback-wrong"}`;

  document.querySelectorAll(".quiz-opt-btn").forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answerIndex) btn.classList.add("opt-correct");
    else if (i === selectedIndex && !hit) btn.classList.add("opt-wrong");
  });

  document.getElementById("quizNext").classList.remove("hidden");
}

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
