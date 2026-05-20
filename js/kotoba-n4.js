/* ── KOTOBA N4 PAGE ── uses kotobaN4[] and catLangKeyN4 from data.js */

let kotobaMode = "study";
let fcData = [],
  fcIndex = 0,
  fcFlipped = false,
  fcOrder = [];

function _hasKanji(str) {
  return /[一-鿿]/.test(str);
}

function _renderFurigana(jp, kana) {
  if (!kana || !_hasKanji(jp)) return `<span class="k-jp">${jp}</span>`;
  return `<span class="k-furigana">${kana}</span><span class="k-jp">${jp}</span>`;
}

function loadKotobaN5() {
  // called generically by core language toggle
  loadKotoba();
}

function loadKotoba() {
  const container = document.getElementById("kotobaContainer");
  if (!container) return;
  const t = language[currentLang];
  const premium = isPremium();
  container.innerHTML = "";

  const grouped = {};
  kotobaN4.forEach((item) => {
    if (!grouped[item.cat]) grouped[item.cat] = [];
    grouped[item.cat].push(item);
  });

  Object.keys(grouped).forEach((cat) => {
    const words = grouped[cat];
    const cutoff = getFreeLimit(words.length);
    const visible = words.slice(0, cutoff);
    const hidden = words.length - cutoff;

    const section = document.createElement("section");
    section.className = "kotoba-section";

    const titleEl   = document.createElement("h2");
    titleEl.className = "kotoba-category";
    const labelKey  = catLangKeyN4[cat] || "catN4Act";
    const seenSet   = typeof getSeenSet === "function" ? getSeenSet("kotobaN4") : new Set();
    const seenCount = visible.filter((w) => seenSet.has(w.jp)).length;
    const pct       = visible.length > 0 ? Math.round((seenCount / visible.length) * 100) : 0;
    const pctBadge  = pct > 0 ? `<span class="progress-pct">${pct}% ✓</span>` : "";
    titleEl.innerHTML = `
      <span>${t[labelKey] || cat.toUpperCase()}</span>
      <span class="word-count">${premium ? words.length : cutoff} / ${words.length} ${t.wordCount} ${pctBadge}</span>
    `;
    section.appendChild(titleEl);
    if (pct > 0) {
      const bar = document.createElement("div");
      bar.className = "section-progress-bar";
      bar.innerHTML = `<div class="section-progress-fill" style="width:${pct}%"></div>`;
      section.appendChild(bar);
    }

    const grid = document.createElement("div");
    grid.className = "kotoba-grid";

    visible.forEach((k, i) => {
      const meaning = k[currentLang] || k.id;
      const card = document.createElement("div");
      card.className = "card kotoba-card";
      card.style.animationDelay = `${i * 0.025}s`;
      card.innerHTML = `
        ${_renderFurigana(k.jp, k.kana)}
        <span class="k-romaji">${k.romaji}</span>
        <span class="k-meaning hidden">${meaning}</span>
      `;
      card.addEventListener("click", () => {
        const meaningEl = card.querySelector(".k-meaning");
        const wasHidden = meaningEl.classList.contains("hidden");
        meaningEl.classList.toggle("hidden");
        card.classList.add("card-pop");
        setTimeout(() => card.classList.remove("card-pop"), 200);
        if (wasHidden && typeof markSeen === "function") markSeen("kotobaN4", k.jp);
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

  const fcLimit = getFreeLimit(kotobaN4.length);
  fcData = kotobaN4.slice(0, fcLimit);
  fcOrder = fcData.map((_, i) => i);
  if (kotobaMode === "flash") renderFc();
}

function toggleMode() {
  kotobaMode = kotobaMode === "study" ? "flash" : "study";
  const t = language[currentLang];
  document
    .getElementById("studyView")
    .classList.toggle("hidden", kotobaMode === "flash");
  document
    .getElementById("flashcardView")
    .classList.toggle("hidden", kotobaMode === "study");
  const btn = document.getElementById("modeBtn");
  if (btn)
    btn.textContent =
      kotobaMode === "study" ? `🃏 ${t.flashMode}` : `📖 ${t.studyMode}`;
  if (kotobaMode === "flash") {
    fcIndex = 0;
    fcFlipped = false;
    renderFc();
  }
}

function renderFc() {
  if (!fcData.length) return;
  const item = fcData[fcOrder[fcIndex]];
  const t = language[currentLang];
  document.getElementById("fcProgress").textContent =
    `${fcIndex + 1} / ${fcData.length}`;
  const frontEl = document.getElementById("fcFront");
  if (_hasKanji(item.jp) && item.kana) {
    frontEl.innerHTML = `<span class="fc-furigana">${item.kana}</span><span class="fc-kanji">${item.jp}</span>`;
  } else {
    frontEl.textContent = item.jp;
  }
  document.getElementById("fcRomaji").textContent = item.romaji;
  document.getElementById("fcMeaning").textContent =
    item[currentLang] || item.id;
  document.getElementById("fcHint").textContent = t.tapFlip;
  document.getElementById("fcCardInner").classList.toggle("flipped", fcFlipped);
  document.getElementById("fcPrevBtn").textContent = `← ${t.prev}`;
  document.getElementById("fcNextBtn").textContent = `${t.next} →`;
  document.getElementById("fcResetBtn").textContent = `↺ ${t.reset}`;
}

function refreshFcLabels() {
  if (kotobaMode === "flash") renderFc();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn)
    btn.textContent =
      kotobaMode === "study" ? `🃏 ${t.flashMode}` : `📖 ${t.studyMode}`;
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
  fcOrder = fcData.map((_, i) => i);
  if (document.getElementById("fcShuffle").checked) {
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
  if (kotobaMode !== "flash") return;
  if (e.key === "ArrowRight") fcNext();
  if (e.key === "ArrowLeft") fcPrev();
  if (e.key === " ") {
    e.preventDefault();
    fcFlip();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadKotoba();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = `🃏 ${t.flashMode}`;
});
