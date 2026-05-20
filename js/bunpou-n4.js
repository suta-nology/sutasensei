/* ── BUNPOU N4 PAGE ── uses bunpouN4[] from data.js */

let bunpouMode = "study";
let fcData = [],
  fcIndex = 0,
  fcFlipped = false,
  fcOrder = [];

function loadBunpou() {
  const container = document.getElementById("bunpouContainer");
  if (!container) return;
  const t = language[currentLang];
  const premium = isPremium();
  const cutoff = getFreeLimit(bunpouN4.length);
  const visible = bunpouN4.slice(0, cutoff);
  const hidden = bunpouN4.length - cutoff;
  container.innerHTML = "";

  visible.forEach((item, i) => {
    const c = item[currentLang];
    const card = document.createElement("div");
    card.className = "bunpou-card";
    card.style.animationDelay = `${i * 0.07}s`;
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
    teaser.innerHTML = `<span class="teaser-lock">🔒</span><p>${t.teaserLocked(hidden)}</p>`;
    container.appendChild(teaser);
  }

  const fcLimit = getFreeLimit(bunpouN4.length);
  fcData = bunpouN4.slice(0, fcLimit);
  fcOrder = fcData.map((_, i) => i);
  if (bunpouMode === "flash") renderFc();
}

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

function renderFc() {
  if (!fcData.length) return;
  const item = fcData[fcOrder[fcIndex]];
  const c = item[currentLang];
  const t = language[currentLang];
  document.getElementById("fcProgress").textContent =
    `${fcIndex + 1} / ${fcData.length}`;
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
  if (bunpouMode !== "flash") return;
  if (e.key === "ArrowRight") fcNext();
  if (e.key === "ArrowLeft") fcPrev();
  if (e.key === " ") {
    e.preventDefault();
    fcFlip();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadBunpou();
  const t = language[currentLang];
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = `🃏 ${t.flashMode}`;
});
