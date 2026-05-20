/* ── KANA PAGE ── */

let kanaType = "hiragana";
let kanaMode = "study";

// Flashcard state
let fcData = [];
let fcIndex = 0;
let fcFlipped = false;
let fcOrder = [];

/* ── STUDY VIEW (full access for all users) ── */

function loadKana() {
  const grid = document.getElementById("kanaGrid");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  kanaType = params.get("type") || "hiragana";
  const source = kanaType === "katakana" ? katakana : hiragana;

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) {
    titleEl.textContent =
      language[currentLang][
        kanaType === "katakana" ? "katakanaTitle" : "hiraganaTitle"
      ];
  }

  grid.innerHTML = "";
  source.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "card kana-card";
    card.style.animationDelay = `${i * 0.018}s`;
    if (!item.jp) {
      card.style.visibility = "hidden";
    } else {
      card.innerHTML = `${item.jp}<span>${item.romaji}</span>`;
      card.addEventListener("click", () => {
        card.classList.add("card-pop");
        setTimeout(() => card.classList.remove("card-pop"), 200);
      });
    }
    grid.appendChild(card);
  });

  // Rebuild flashcard data — 25% for free users
  const fullData = (kanaType === "katakana" ? katakana : hiragana).filter(
    (k) => k.jp !== "",
  );
  const limit = getFreeLimit(fullData.length);
  fcData = fullData.slice(0, limit);
  fcOrder = fcData.map((_, i) => i);
}

/* ── MODE TOGGLE ── */

function toggleMode() {
  kanaMode = kanaMode === "study" ? "flash" : "study";
  const t = language[currentLang];

  document
    .getElementById("studyView")
    .classList.toggle("hidden", kanaMode === "flash");
  document
    .getElementById("flashcardView")
    .classList.toggle("hidden", kanaMode === "study");

  const btn = document.getElementById("modeBtn");
  if (btn)
    btn.textContent =
      kanaMode === "study" ? `🃏 ${t.flashMode}` : `📖 ${t.studyMode}`;

  if (kanaMode === "flash") {
    fcIndex = 0;
    fcFlipped = false;
    renderFc();
  }
}

/* ── FLASHCARD RENDER ── */

function renderFc() {
  if (!fcData.length) return;
  const item = fcData[fcOrder[fcIndex]];
  const total = fcData.length;
  const t = language[currentLang];

  document.getElementById("fcProgress").textContent =
    `${fcIndex + 1} / ${total}${!isPremium() ? "  🔒 Free" : ""}`;
  document.getElementById("fcFront").textContent = item.jp;
  document.getElementById("fcRomaji").textContent = item.romaji;
  document.getElementById("fcHint").textContent = t.tapFlip;

  document.getElementById("fcCardInner").classList.toggle("flipped", fcFlipped);
  document.getElementById("fcPrevBtn").textContent = `← ${t.prev}`;
  document.getElementById("fcNextBtn").textContent = `${t.next} →`;
  document.getElementById("fcResetBtn").textContent = `↺ ${t.reset}`;
}

function refreshFcLabels() {
  if (kanaMode === "flash") renderFc();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn)
    btn.textContent =
      kanaMode === "study" ? `🃏 ${t.flashMode}` : `📖 ${t.studyMode}`;
}

function fcFlip() {
  fcFlipped = !fcFlipped;
  document.getElementById("fcCardInner").classList.toggle("flipped", fcFlipped);
}

function fcNext() {
  if (fcIndex < fcData.length - 1) {
    fcIndex++;
    fcFlipped = false;
    renderFc();
  }
}

function fcPrev() {
  if (fcIndex > 0) {
    fcIndex--;
    fcFlipped = false;
    renderFc();
  }
}

function fcReset() {
  fcIndex = 0;
  fcFlipped = false;
  renderFc();
}

function fcToggleShuffle() {
  const checked = document.getElementById("fcShuffle").checked;
  fcOrder = fcData.map((_, i) => i);
  if (checked) {
    for (let i = fcOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fcOrder[i], fcOrder[j]] = [fcOrder[j], fcOrder[i]];
    }
  }
  fcIndex = 0;
  fcFlipped = false;
  renderFc();
}

/* ── KEYBOARD NAV ── */

document.addEventListener("keydown", (e) => {
  if (kanaMode !== "flash") return;
  if (e.key === "ArrowRight") fcNext();
  if (e.key === "ArrowLeft") fcPrev();
  if (e.key === " ") {
    e.preventDefault();
    fcFlip();
  }
});

/* ── PAGE INIT ── */

window.addEventListener("DOMContentLoaded", () => {
  loadKana();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = `🃏 ${t.flashMode}`;
});
