/* ── KANJI N5 PAGE (PREMIUM) ── */

let kanjiMode = "study";
let fcData = [];
let fcIndex = 0;
let fcFlipped = false;
let fcOrder = [];

/* ── STUDY VIEW ── */

function loadKanji() {
  const container = document.getElementById("kanjiContainer");
  if (!container) return;

  const t = language[currentLang];
  const premium = isPremium();
  container.innerHTML = "";

  // Group by category
  const grouped = {};
  kanjiN5.forEach((item) => {
    if (!grouped[item.cat]) grouped[item.cat] = [];
    grouped[item.cat].push(item);
  });

  const catOrder = [
    "num",
    "time",
    "nat",
    "dir",
    "ppl",
    "desc",
    "sch",
    "act",
    "body",
  ];

  catOrder.forEach((cat) => {
    const items = grouped[cat];
    if (!items || !items.length) return;
    const cutoff = getFreeLimit(items.length);
    const visible = items.slice(0, cutoff);
    const hidden = items.length - cutoff;

    const section = document.createElement("section");
    section.className = "kanji-section";

    const title     = document.createElement("h2");
    title.className = "kotoba-category";
    const labelKey  = kanjiCatKey[cat] || "catKanjiNum";
    const seenSet   = typeof getSeenSet === "function" ? getSeenSet("kanjiN5") : new Set();
    const seenCount = visible.filter((k) => seenSet.has(k.kanji)).length;
    const pct       = visible.length > 0 ? Math.round((seenCount / visible.length) * 100) : 0;
    const pctBadge  = pct > 0 ? `<span class="progress-pct">${pct}% ✓</span>` : "";
    title.innerHTML = `
      <span>${t[labelKey] || cat.toUpperCase()}</span>
      <span class="word-count">${premium ? items.length : cutoff} / ${items.length} ${t.kanjiCount} ${pctBadge}</span>
    `;
    section.appendChild(title);
    if (pct > 0) {
      const bar = document.createElement("div");
      bar.className = "section-progress-bar";
      bar.innerHTML = `<div class="section-progress-fill" style="width:${pct}%"></div>`;
      section.appendChild(bar);
    }

    const grid = document.createElement("div");
    grid.className = "kanji-grid";

    visible.forEach((k, i) => {
      const card = document.createElement("div");
      card.className = "kanji-card";
      card.style.animationDelay = `${i * 0.03}s`;
      card.innerHTML = `
        <span class="kj-char">${k.kanji}</span>
        <span class="kj-meaning">${currentLang === "id" ? k.id : k.en}</span>
        <div class="kj-detail hidden">
          <div class="kj-row"><span class="kj-label">${t.onyomi}</span><span class="kj-val">${k.on}</span></div>
          <div class="kj-row"><span class="kj-label">${t.kunyomi}</span><span class="kj-val">${k.kun}</span></div>
          <div class="kj-example">
            <span class="kj-ex-char">${k.ex_jp}</span>
            <span class="kj-ex-kana">${k.ex_kana}</span>
            <span class="kj-ex-meaning">${currentLang === "id" ? k.ex_id : k.ex_en}</span>
          </div>
        </div>
      `;
      card.addEventListener("click", () => {
        const detail    = card.querySelector(".kj-detail");
        const wasHidden = detail.classList.contains("hidden");
        detail.classList.toggle("hidden");
        card.classList.toggle("kj-open");
        card.classList.add("card-pop");
        setTimeout(() => card.classList.remove("card-pop"), 200);
        if (wasHidden && typeof markSeen === "function") markSeen("kanjiN5", k.kanji);
      });
      grid.appendChild(card);
    });

    section.appendChild(grid);

    if (!premium && hidden > 0) {
      const teaser = document.createElement("div");
      teaser.className = "premium-teaser";
      teaser.innerHTML = `<span class="teaser-lock">🔒</span><p>${t.teaserLocked(hidden)}</p>`;
      section.appendChild(teaser);
    }

    container.appendChild(section);
  });

  // Rebuild flashcard data
  const allKanji = kanjiN5;
  const fcLimit = getFreeLimit(allKanji.length);
  fcData = allKanji.slice(0, fcLimit);
  fcOrder = fcData.map((_, i) => i);
  if (kanjiMode === "flash") renderFc();
}

/* ── MODE TOGGLE ── */

function toggleMode() {
  kanjiMode = kanjiMode === "study" ? "flash" : "study";
  const t = language[currentLang];
  document
    .getElementById("studyView")
    .classList.toggle("hidden", kanjiMode === "flash");
  document
    .getElementById("flashcardView")
    .classList.toggle("hidden", kanjiMode === "study");
  const btn = document.getElementById("modeBtn");
  if (btn)
    btn.textContent =
      kanjiMode === "study" ? `🃏 ${t.flashMode}` : `📖 ${t.studyMode}`;
  if (kanjiMode === "flash") {
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
    `${fcIndex + 1} / ${total}${!isPremium() ? "  🔒" : ""}`;
  document.getElementById("fcFront").textContent = item.kanji;
  document.getElementById("fcHint").textContent = t.tapFlip;

  const backEl = document.getElementById("fcBack");
  backEl.innerHTML = `
    <span class="fc-kanji-meaning">${currentLang === "id" ? item.id : item.en}</span>
    <div class="fc-kanji-readings">
      <div><span class="fc-label">${t.onyomi}:</span> ${item.on}</div>
      <div><span class="fc-label">${t.kunyomi}:</span> ${item.kun}</div>
    </div>
    <div class="fc-kanji-example">
      <span class="fc-ex-char">${item.ex_jp}</span>
      <span class="fc-ex-kana">${item.ex_kana}</span>
      <span class="fc-ex-mean">${currentLang === "id" ? item.ex_id : item.ex_en}</span>
    </div>
  `;

  document.getElementById("fcCardInner").classList.toggle("flipped", fcFlipped);
  document.getElementById("fcPrevBtn").textContent = `← ${t.prev}`;
  document.getElementById("fcNextBtn").textContent = `${t.next} →`;
  document.getElementById("fcResetBtn").textContent = `↺ ${t.reset}`;
}

function refreshFcLabels() {
  if (kanjiMode === "flash") renderFc();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn)
    btn.textContent =
      kanjiMode === "study" ? `🃏 ${t.flashMode}` : `📖 ${t.studyMode}`;
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

document.addEventListener("keydown", (e) => {
  if (kanjiMode !== "flash") return;
  if (e.key === "ArrowRight") fcNext();
  if (e.key === "ArrowLeft") fcPrev();
  if (e.key === " ") {
    e.preventDefault();
    fcFlip();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadKanji();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = `🃏 ${t.flashMode}`;
});
