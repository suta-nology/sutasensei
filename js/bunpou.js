/* ── BUNPOU PAGE ── */

let bunpouMode = "study";

// Flashcard state
let fcData = [];
let fcIndex = 0;
let fcFlipped = false;
let fcOrder = [];

/* ── STUDY VIEW ── */

function loadBunpou() {
  const container = document.getElementById("bunpouContainer");
  if (!container) return;

  const t = language[currentLang];
  const premium = isPremium();
  const cutoff = getFreeLimit(bunpouN5.length);
  const visible = bunpouN5.slice(0, cutoff);
  const hidden = bunpouN5.length - cutoff;

  container.innerHTML = "";

  // Show overall progress at top of container
  const totalSeen = typeof getSeenCount === "function" ? getSeenCount("bunpouN5") : 0;
  const totalPct  = visible.length > 0 ? Math.round((Math.min(totalSeen, visible.length) / visible.length) * 100) : 0;
  if (totalPct > 0) {
    const progressHeader = document.createElement("div");
    progressHeader.className = "bunpou-progress-header";
    progressHeader.innerHTML = `
      <span class="progress-pct">${totalPct}% ${t.progressLabel || "studied"} ✓</span>
      <div class="section-progress-bar" style="margin-top:6px"><div class="section-progress-fill" style="width:${totalPct}%"></div></div>
    `;
    container.appendChild(progressHeader);
  }

  visible.forEach((item, i) => {
    const c = item[currentLang];
    const card = document.createElement("div");
    card.className = "bunpou-card";
    card.style.animationDelay = `${i * 0.07}s`;
    if (typeof markSeen === "function") markSeen("bunpouN5", item.jp);
    card.innerHTML = `
      <div class="grammar-header">
        <span class="grammar-jp">${item.jp}</span>
        <span class="grammar-name">${c.name}</span>
      </div>
      <p class="grammar-desc">${c.desc}</p>
      <div class="example-box">
        <p class="example-sentence">${c.sentence}</p>
        <span class="example-romaji">${c.romaji}</span>
        <small class="example-arti">${c.arti}</small>
      </div>
    `;
    container.appendChild(card);
  });

  if (!premium && hidden > 0) {
    const teaser = document.createElement("div");
    teaser.className = "premium-teaser";
    teaser.innerHTML = `
      <span class="teaser-lock">🔒</span>
      <p>${t.teaserLocked(hidden)}</p>
    `;
    container.appendChild(teaser);
  }

  // Rebuild flashcard data
  const fcLimit = getFreeLimit(bunpouN5.length);
  fcData = bunpouN5.slice(0, fcLimit);
  fcOrder = fcData.map((_, i) => i);
  if (bunpouMode === "flash") renderFc();
}

/* ── MODE TOGGLE ── */

function toggleMode() {
  bunpouMode = bunpouMode === "study" ? "flash" : "study";
  const t = language[currentLang];

  document
    .getElementById("studyView")
    .classList.toggle("hidden", bunpouMode === "flash");
  document
    .getElementById("flashcardView")
    .classList.toggle("hidden", bunpouMode === "study");

  const btn = document.getElementById("modeBtn");
  if (btn)
    btn.textContent =
      bunpouMode === "study" ? `🃏 ${t.flashMode}` : `📖 ${t.studyMode}`;

  if (bunpouMode === "flash") {
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
  const c = item[currentLang];
  const t = language[currentLang];

  document.getElementById("fcProgress").textContent =
    `${fcIndex + 1} / ${total}`;
  document.getElementById("fcFront").textContent = item.jp;
  document.getElementById("fcRomaji").textContent = c.name;
  document.getElementById("fcMeaning").textContent =
    `${c.sentence}  —  ${c.arti}`;
  document.getElementById("fcHint").textContent = t.tapFlip;

  document.getElementById("fcCardInner").classList.toggle("flipped", fcFlipped);
  document.getElementById("fcPrevBtn").textContent = `← ${t.prev}`;
  document.getElementById("fcNextBtn").textContent = `${t.next} →`;
  document.getElementById("fcResetBtn").textContent = `↺ ${t.reset}`;
}

function refreshFcLabels() {
  if (bunpouMode === "flash") renderFc();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn)
    btn.textContent =
      bunpouMode === "study" ? `🃏 ${t.flashMode}` : `📖 ${t.studyMode}`;
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
  if (bunpouMode !== "flash") return;
  if (e.key === "ArrowRight") fcNext();
  if (e.key === "ArrowLeft") fcPrev();
  if (e.key === " ") {
    e.preventDefault();
    fcFlip();
  }
});

/* ── PAGE INIT ── */

window.addEventListener("DOMContentLoaded", () => {
  loadBunpou();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = `🃏 ${t.flashMode}`;
});
