/* ── KOTOBA PAGE ── */

let kotobaMode = "study";
let fcData = [];
let fcIndex = 0;
let fcFlipped = false;
let fcOrder = [];

/* ── HELPERS ── */

function _hasKanji(str) {
  return /[一-鿿]/.test(str);
}

function _renderFurigana(jp, kana) {
  if (!kana || !_hasKanji(jp)) return `<span class="k-jp">${jp}</span>`;
  return `<span class="k-furigana">${kana}</span><span class="k-jp">${jp}</span>`;
}

/* ── STUDY VIEW ── */

function loadKotobaN5() {
  const container = document.getElementById("kotobaContainer");
  if (!container) return;

  const t = language[currentLang];
  const premium = isPremium();
  container.innerHTML = "";

  const grouped = {};
  kotobaN5.forEach((item) => {
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

    const title = document.createElement("h2");
    title.className = "kotoba-category";
    const labelKey = catLangKey[cat] || "catFamily";
    title.innerHTML = `
      <span>${t[labelKey] || cat.toUpperCase()}</span>
      <span class="word-count">${premium ? words.length : cutoff} / ${words.length} ${t.wordCount}</span>
    `;
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "kotoba-grid";

    visible.forEach((k, i) => {
      const meaning = k[currentLang] || k.id;
      const furiganaHtml = _renderFurigana(k.jp, k.kana);

      const card = document.createElement("div");
      card.className = "card kotoba-card";
      card.style.animationDelay = `${i * 0.025}s`;
      card.innerHTML = `
        ${furiganaHtml}
        <span class="k-romaji">${k.romaji}</span>
        <span class="k-meaning hidden">${meaning}</span>
      `;
      card.addEventListener("click", () => {
        card.querySelector(".k-meaning").classList.toggle("hidden");
        card.classList.add("card-pop");
        setTimeout(() => card.classList.remove("card-pop"), 200);
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

  // Rebuild flashcard data (limited for free)
  const allWords = kotobaN5;
  const fcLimit = getFreeLimit(allWords.length);
  fcData = allWords.slice(0, fcLimit);
  fcOrder = fcData.map((_, i) => i);
  if (kotobaMode === "flash") renderFc();
}

/* ── MODE TOGGLE ── */

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

/* ── FLASHCARD RENDER ── */

function renderFc() {
  if (!fcData.length) return;
  const item = fcData[fcOrder[fcIndex]];
  const total = fcData.length;
  const t = language[currentLang];

  document.getElementById("fcProgress").textContent =
    `${fcIndex + 1} / ${total}${!isPremium() ? "  🔒" : ""}`;

  // Front: show furigana + kanji
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
  if (kotobaMode !== "flash") return;
  if (e.key === "ArrowRight") fcNext();
  if (e.key === "ArrowLeft") fcPrev();
  if (e.key === " ") {
    e.preventDefault();
    fcFlip();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadKotobaN5();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = `🃏 ${t.flashMode}`;
});
