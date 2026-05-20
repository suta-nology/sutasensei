/* ── LANGUAGE ── */

let currentLang = localStorage.getItem("lang") || "id";

function applyLanguage() {
  const t = language[currentLang];
  document.querySelectorAll("[data-lang]").forEach((el) => {
    const key = el.dataset.lang;
    if (t[key] !== undefined && typeof t[key] === "string") el.textContent = t[key];
  });
  document.querySelectorAll("[data-placeholder]").forEach((el) => {
    const key = el.dataset.placeholder;
    if (t[key]) el.placeholder = t[key];
  });
  const langBtn = document.getElementById("langBtn");
  if (langBtn) langBtn.textContent = currentLang === "id" ? "EN" : "ID";
  _updateThemeBtn();
}

function toggleLanguage() {
  currentLang = currentLang === "id" ? "en" : "id";
  localStorage.setItem("lang", currentLang);
  applyLanguage();
  if (typeof loadBunpou    === "function") loadBunpou();
  if (typeof loadKotobaN5 === "function") loadKotobaN5();
  if (typeof loadKana     === "function") loadKana();
  if (typeof refreshFcLabels === "function") refreshFcLabels();
  checkPremium();
}

/* ── DARK / LIGHT THEME ── */

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  _updateThemeBtn();
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(cur === "dark" ? "light" : "dark");
}

function _updateThemeBtn() {
  const themeBtn = document.getElementById("themeBtn");
  if (!themeBtn) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  themeBtn.textContent = isDark ? "☀️" : "🌙";
}

/* ── PREMIUM HELPERS ── */

function isPremium() {
  return localStorage.getItem("premium") === "true";
}

function getFreeLimit(total) {
  return isPremium() ? total : Math.ceil(total * 0.2);
}

function checkPremium() {
  if (!isPremium()) return;
  document.querySelectorAll(".locked").forEach((el) => {
    el.classList.remove("locked");
    const target = el.dataset.target;
    if (target) el.onclick = () => (window.location.href = target);
  });
}

/* ── FIREBASE AUTH HELPERS ── */

async function _lookupEmail(username) {
  try {
    const doc = await _db.collection("usernames").doc(username.toLowerCase()).get();
    if (doc.exists) return doc.data().email;
  } catch (_) {}
  return username.toLowerCase().replace(/[^a-z0-9_.-]/g, "") + "@sutasensei.app";
}

function _isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function _syncUserFromFirestore(uid) {
  try {
    const doc  = await _db.collection("users").doc(uid).get();
    if (!doc.exists) return null;
    const data = doc.data();
    const isPrem = data.premium === true || data.role === "admin" || data.role === "subscription";
    localStorage.setItem("uid",      uid);
    localStorage.setItem("username", data.username || "user");
    localStorage.setItem("role",     data.role     || "free");
    localStorage.setItem("premium",  isPrem ? "true" : "false");
    return data;
  } catch (e) {
    console.warn("Firestore sync failed:", e.message);
    return null;
  }
}

/* ── GUEST LOGIN ── */

async function loginAsGuest() {
  try { await _auth.signInAnonymously(); } catch (_) {}
  localStorage.setItem("loggedIn", "true");
  localStorage.setItem("role",     "free");
  localStorage.setItem("username", "guest");
  localStorage.setItem("premium",  "false");
  showMenu();
}

/* ── LOGIN ── */

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const status   = document.getElementById("loginStatus");
  const t        = language[currentLang];

  if (!username || !password) {
    status.textContent = t.loginFail; status.style.color = "#ff4d6d"; return;
  }

  const btn = document.querySelector("#loginPage .btn-primary");
  if (btn) btn.disabled = true;

  try {
    const email = await _lookupEmail(username);
    const cred  = await _auth.signInWithEmailAndPassword(email, password);
    await _syncUserFromFirestore(cred.user.uid);
    await _loadSeenFromFirestore(cred.user.uid);
    localStorage.setItem("loggedIn", "true");
    showMenu();
  } catch (e) {
    status.textContent = t.loginFail; status.style.color = "#ff4d6d";
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ── SHOW MENU ── */

function showMenu() {
  const role     = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  document.getElementById("loginPage")?.classList.add("hidden");
  document.getElementById("registerPage")?.classList.add("hidden");
  document.getElementById("forgotPage")?.classList.add("hidden");
  document.getElementById("menuPage")?.classList.remove("hidden");

  const welcomeEl = document.getElementById("welcomeText");
  if (welcomeEl) welcomeEl.textContent = `こんにちは、${username} さん`;

  const roleEl = document.getElementById("roleText");
  if (!roleEl) return;

  if (role === "admin" || role === "subscription") {
    roleEl.textContent = "SUBSCRIPTION ⭐";
    roleEl.className   = "role-badge role-premium";
    localStorage.setItem("premium", "true");
  } else {
    roleEl.textContent = "FREE";
    roleEl.className   = "role-badge role-free";
    localStorage.setItem("premium", "false");
  }

  applyLanguage();
}

/* ── LOGOUT ── */

async function logout() {
  await _saveSeenToFirestore();
  try { await _auth.signOut(); } catch (_) {}
  localStorage.clear();
  location.reload();
}

/* ── REGISTER ── */

function showRegister() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.remove("hidden");
  document.getElementById("regStatus").textContent = "";
  ["regUsername", "regEmail", "regPassword", "regConfirm"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function showLogin() {
  document.getElementById("registerPage")?.classList.add("hidden");
  document.getElementById("forgotPage")?.classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
  const s = document.getElementById("loginStatus");
  if (s) s.textContent = "";
}

async function register() {
  const username = document.getElementById("regUsername").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm  = document.getElementById("regConfirm").value;
  const status   = document.getElementById("regStatus");
  const t        = language[currentLang];

  if (!username)             { status.textContent = t.usernameReq;  status.style.color = "#ff4d6d"; return; }
  if (!_isValidEmail(email)) { status.textContent = t.emailInvalid; status.style.color = "#ff4d6d"; return; }
  if (password.length < 6)   { status.textContent = t.passShort;    status.style.color = "#ff4d6d"; return; }
  if (password !== confirm)  { status.textContent = t.passMismatch; status.style.color = "#ff4d6d"; return; }

  const btn = document.querySelector("#registerPage .btn-primary");
  if (btn) btn.disabled = true;

  try {
    const taken = await _db.collection("usernames").doc(username.toLowerCase()).get();
    if (taken.exists) {
      status.textContent = t.userTaken; status.style.color = "#ff4d6d";
      if (btn) btn.disabled = false; return;
    }

    const cred = await _auth.createUserWithEmailAndPassword(email, password);
    const uid  = cred.user.uid;

    await _db.collection("users").doc(uid).set({
      username, email, premium: false, role: "free",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await _db.collection("usernames").doc(username.toLowerCase()).set({ uid, email });

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("uid",      uid);
    localStorage.setItem("username", username);
    localStorage.setItem("role",     "free");
    localStorage.setItem("premium",  "false");
    showMenu();
  } catch (e) {
    status.textContent = e.code === "auth/email-already-in-use" ? t.userTaken : (e.message || t.loginFail);
    status.style.color = "#ff4d6d";
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ── FORGOT PASSWORD ── */

function showForgotPassword() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("forgotPage").classList.remove("hidden");
  const s = document.getElementById("forgotStatus"); if (s) s.textContent = "";
  const inp = document.getElementById("forgotUsername"); if (inp) inp.value = "";
}

async function forgotPassword() {
  const username = document.getElementById("forgotUsername").value.trim();
  const status   = document.getElementById("forgotStatus");
  const t        = language[currentLang];

  if (!username) { status.textContent = t.usernameReq; status.style.color = "#ff4d6d"; return; }

  const btn = document.querySelector("#forgotPage .btn-primary");
  if (btn) btn.disabled = true;

  try {
    const doc = await _db.collection("usernames").doc(username.toLowerCase()).get();
    if (!doc.exists) {
      status.textContent = t.forgotNotFound; status.style.color = "#ff4d6d"; return;
    }
    await _auth.sendPasswordResetEmail(doc.data().email);
    status.textContent = t.forgotSent; status.style.color = "#22c55e";
  } catch (e) {
    status.textContent = t.loginFail; status.style.color = "#ff4d6d";
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ── PROGRESS TRACKING ── */

const _seenData  = {};
let   _seenTimer;

function markSeen(materialKey, itemId) {
  if (!_seenData[materialKey]) {
    const stored = localStorage.getItem("seen_" + materialKey);
    _seenData[materialKey] = stored ? new Set(JSON.parse(stored)) : new Set();
  }
  _seenData[materialKey].add(String(itemId));
  localStorage.setItem("seen_" + materialKey, JSON.stringify([..._seenData[materialKey]]));
  clearTimeout(_seenTimer);
  _seenTimer = setTimeout(_saveSeenToFirestore, 5000);
}

function getSeenSet(materialKey) {
  if (_seenData[materialKey]) return _seenData[materialKey];
  const stored = localStorage.getItem("seen_" + materialKey);
  if (!stored) return new Set();
  _seenData[materialKey] = new Set(JSON.parse(stored));
  return _seenData[materialKey];
}

function getSeenCount(materialKey)        { return getSeenSet(materialKey).size; }
function getSeenPercent(materialKey, tot) { return tot > 0 ? Math.round((getSeenCount(materialKey) / tot) * 100) : 0; }

async function _saveSeenToFirestore() {
  const uid = localStorage.getItem("uid");
  if (!uid || typeof _db === "undefined") return;
  const obj = {};
  Object.keys(_seenData).forEach((k) => { obj[k] = [..._seenData[k]]; });
  if (!Object.keys(obj).length) return;
  try { await _db.collection("users").doc(uid).update({ progress: obj }); } catch (_) {}
}

async function _loadSeenFromFirestore(uid) {
  if (!uid || typeof _db === "undefined") return;
  try {
    const doc = await _db.collection("users").doc(uid).get();
    if (!doc.exists || !doc.data().progress) return;
    const remote = doc.data().progress;
    Object.keys(remote).forEach((k) => {
      const merged = new Set([...getSeenSet(k), ...remote[k]]);
      _seenData[k] = merged;
      localStorage.setItem("seen_" + k, JSON.stringify([...merged]));
    });
  } catch (_) {}
}

/* ── NAVIGATION ── */

function goBack()    { window.history.back(); }
function goToLevel() { window.location.href = "level.html"; }
function goToN5()    { window.location.href = "n5/pilihan.html"; }
function goToN4()    { window.location.href = "n4/pilihan.html"; }
function alertN4()   { alert(language[currentLang].n4); }

function handleLoginKey(e)    { if (e.key === "Enter") login(); }
function handleRegisterKey(e) { if (e.key === "Enter") register(); }
function handleForgotKey(e)   { if (e.key === "Enter") forgotPassword(); }

/* ── INIT ── */

window.addEventListener("DOMContentLoaded", () => {
  applyTheme(localStorage.getItem("theme") || "light");
  applyLanguage();
  checkPremium();

  if (localStorage.getItem("loggedIn") === "true") {
    const menuPage = document.getElementById("menuPage");
    if (menuPage) showMenu();
  }

  if (typeof _auth !== "undefined") {
    _auth.onAuthStateChanged(async (user) => {
      if (user && !user.isAnonymous) {
        const data = await _syncUserFromFirestore(user.uid);
        await _loadSeenFromFirestore(user.uid);
        if (data) {
          const menuPage = document.getElementById("menuPage");
          if (menuPage && !menuPage.classList.contains("hidden")) showMenu();
        }
      } else if (
        !user &&
        localStorage.getItem("loggedIn") === "true" &&
        localStorage.getItem("username") !== "guest"
      ) {
        localStorage.clear();
        location.reload();
      }
    });
  }
});
