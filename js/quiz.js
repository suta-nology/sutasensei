/* ── QUIZ N5 ── */

const PREMIUM_TOTAL = 15;
const FREE_TOTAL = 5;

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

/* ── SHUFFLE ── */

function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── QUESTION GENERATION ── */

function _buildVocabQuestion(item, pool) {
  const correct = item[currentLang] || item.id;
  const wrongs = _shuffle(
    pool.filter((w) => w.jp !== item.jp).map((w) => w[currentLang] || w.id),
  ).slice(0, 3);
  const options = _shuffle([correct, ...wrongs]);
  return {
    type: "vocab",
    questionJP: item.jp,
    questionSub: item.romaji,
    options,
    answerIndex: options.indexOf(correct),
  };
}

function _buildGrammarQuestion(item, pool) {
  const c = item[currentLang];
  const correct = item.jp;
  const wrongs = _shuffle(
    pool.filter((g) => g.jp !== item.jp).map((g) => g.jp),
  ).slice(0, 3);
  const options = _shuffle([correct, ...wrongs]);
  return {
    type: "grammar",
    questionJP: `「${c.name}」`,
    questionSub: c.desc.length > 60 ? c.desc.slice(0, 60) + "…" : c.desc,
    options,
    answerIndex: options.indexOf(correct),
  };
}

function generateQuestions() {
  const total = isPremium() ? PREMIUM_TOTAL : FREE_TOTAL;
  const vocabQ = Math.round(total * 0.7);
  const grammarQ = total - vocabQ;

  const shuffledVocab = _shuffle(kotobaN5);
  const shuffledGrammar = _shuffle(bunpouN5);

  const questions = [];

  shuffledVocab.slice(0, vocabQ).forEach((item) => {
    questions.push(_buildVocabQuestion(item, kotobaN5));
  });

  shuffledGrammar.slice(0, grammarQ).forEach((item) => {
    questions.push(_buildGrammarQuestion(item, bunpouN5));
  });

  return _shuffle(questions);
}

/* ── RENDER ── */

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
  document.getElementById("quizTypeLabel").textContent =
    q.type === "vocab" ? t.quizVocabQ : t.quizGrammarQ;
  document.getElementById("quizJP").textContent = q.questionJP;
  document.getElementById("quizSub").textContent = q.questionSub;
  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("quizFeedback").className = "quiz-feedback";
  document.getElementById("quizNext").classList.add("hidden");

  const optContainer = document.getElementById("quizOptions");
  optContainer.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => answerQuiz(i));
    optContainer.appendChild(btn);
  });

  quizAnswered = false;
}

function answerQuiz(selectedIndex) {
  if (quizAnswered) return;
  quizAnswered = true;

  const t = language[currentLang];
  const q = quizQuestions[quizIndex];
  const correct = q.answerIndex === selectedIndex;
  if (correct) quizScore++;

  const feedback = document.getElementById("quizFeedback");
  feedback.textContent = correct ? t.quizCorrect : t.quizWrong;
  feedback.className =
    "quiz-feedback " + (correct ? "feedback-correct" : "feedback-wrong");

  // Highlight correct / wrong option buttons
  const btns = document.querySelectorAll(".quiz-opt-btn");
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answerIndex) btn.classList.add("opt-correct");
    else if (i === selectedIndex && !correct) btn.classList.add("opt-wrong");
  });

  document.getElementById("quizNext").classList.remove("hidden");
}

function nextQuestion() {
  quizIndex++;
  if (quizIndex >= quizQuestions.length) {
    showResult();
  } else {
    renderQuizQuestion();
  }
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
  const t = language[currentLang];
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

/* ── PAGE INIT ── */

window.addEventListener("DOMContentLoaded", () => {
  const t = language[currentLang];

  // Apply free note if not premium
  const noteEl = document.getElementById("quizFreeNote");
  if (noteEl) {
    noteEl.textContent = isPremium() ? "" : t.quizFreeNote;
    noteEl.style.display = isPremium() ? "none" : "block";
  }

  document.querySelectorAll("[data-lang]").forEach((el) => {
    const key = el.dataset.lang;
    if (t[key] && typeof t[key] === "string") el.textContent = t[key];
  });
});
