/* ── LANGUAGE ── */

let currentLang = localStorage.getItem("lang") || "id";

function applyLanguage() {
  const t = language[currentLang];

  document.querySelectorAll("[data-lang]").forEach((el) => {
    const key = el.dataset.lang;
    if (t[key] !== undefined && typeof t[key] === "string")
      el.textContent = t[key];
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
  if (typeof loadBunpou === "function") loadBunpou();
  if (typeof loadKotobaN5 === "function") loadKotobaN5();
  if (typeof loadKana === "function") loadKana();
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
  return isPremium() ? total : Math.ceil(total * 0.2); /* free = 20% */
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

/* Convert username → internal email (Firebase Auth requires email format) */
function _emailFromUsername(u) {
  return (
    u
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, "") + "@sutasensei.app"
  );
}

/* Pull user profile from Firestore and cache in localStorage */
async function _syncUserFromFirestore(uid) {
  try {
    const doc = await _db.collection("users").doc(uid).get();
    if (!doc.exists) return null;
    const data = doc.data();
    const isPrem =
      data.premium === true ||
      data.role === "admin" ||
      data.role === "subscription";
    localStorage.setItem("uid", uid);
    localStorage.setItem("username", data.username || "user");
    localStorage.setItem("role", data.role || "free");
    localStorage.setItem("premium", isPrem ? "true" : "false");
    return data;
  } catch (e) {
    console.warn("Firestore sync failed:", e.message);
    return null;
  }
}

/* ── ONE-CLICK GUEST LOGIN ── */

async function loginAsGuest() {
  try {
    await _auth.signInAnonymously();
  } catch (_) {
    /* anonymous auth might be disabled — continue anyway */
  }
  localStorage.setItem("loggedIn", "true");
  localStorage.setItem("role", "free");
  localStorage.setItem("username", "guest");
  localStorage.setItem("premium", "false");
  showMenu();
}

/* ── LOGIN ── */

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const status = document.getElementById("loginStatus");
  const t = language[currentLang];

  if (!username || !password) {
    status.textContent = t.loginFail;
    status.style.color = "#ff4d6d";
    return;
  }

  // Disable button to prevent double-submit
  const btn = document.querySelector("#loginPage .btn-primary");
  if (btn) btn.disabled = true;

  try {
    const email = _emailFromUsername(username);
    const cred = await _auth.signInWithEmailAndPassword(email, password);
    await _syncUserFromFirestore(cred.user.uid);
    localStorage.setItem("loggedIn", "true");
    showMenu();
  } catch (e) {
    status.textContent = t.loginFail;
    status.style.color = "#ff4d6d";
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ── SHOW MENU ── */

function showMenu() {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  document.getElementById("loginPage")?.classList.add("hidden");
  document.getElementById("registerPage")?.classList.add("hidden");
  document.getElementById("menuPage")?.classList.remove("hidden");

  const welcomeEl = document.getElementById("welcomeText");
  if (welcomeEl) welcomeEl.textContent = `こんにちは、${username} さん`;

  const roleEl = document.getElementById("roleText");
  if (!roleEl) return;

  if (role === "admin" || role === "subscription") {
    roleEl.textContent = "SUBSCRIPTION ⭐";
    roleEl.className = "role-badge role-premium";
    localStorage.setItem("premium", "true");
  } else {
    roleEl.textContent = "FREE";
    roleEl.className = "role-badge role-free";
    localStorage.setItem("premium", "false");
  }

  applyLanguage();
}

/* ── LOGOUT ── */

async function logout() {
  try {
    await _auth.signOut();
  } catch (_) {}
  localStorage.clear();
  location.reload();
}

/* ── REGISTER ── */

function showRegister() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.remove("hidden");
  document.getElementById("regStatus").textContent = "";
  document.getElementById("regUsername").value = "";
  document.getElementById("regPassword").value = "";
  document.getElementById("regConfirm").value = "";
}

function showLogin() {
  document.getElementById("registerPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("loginStatus").textContent = "";
}

async function register() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;
  const status = document.getElementById("regStatus");
  const t = language[currentLang];

  // Client-side validation
  if (!username) {
    status.textContent = t.usernameReq;
    status.style.color = "#ff4d6d";
    return;
  }
  if (password.length < 6) {
    status.textContent = t.passShort;
    status.style.color = "#ff4d6d";
    return;
  }
  if (password !== confirm) {
    status.textContent = t.passMismatch;
    status.style.color = "#ff4d6d";
    return;
  }

  const btn = document.querySelector("#registerPage .btn-primary");
  if (btn) btn.disabled = true;

  try {
    const email = _emailFromUsername(username);
    const cred = await _auth.createUserWithEmailAndPassword(email, password);

    // Save profile to Firestore
    await _db.collection("users").doc(cred.user.uid).set({
      username,
      premium: false,
      role: "free",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("uid", cred.user.uid);
    localStorage.setItem("username", username);
    localStorage.setItem("role", "free");
    localStorage.setItem("premium", "false");
    showMenu();
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      status.textContent = t.userTaken;
    } else {
      status.textContent = e.message || t.loginFail;
    }
    status.style.color = "#ff4d6d";
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ── NAVIGATION ── */

function goBack() {
  window.history.back();
}
function goToLevel() {
  window.location.href = "level.html";
}
function goToN5() {
  window.location.href = "n5/pilihan.html";
}
function goToN4() {
  window.location.href = "n4/pilihan.html";
}
function alertN4() {
  alert(language[currentLang].n4);
}

function handleLoginKey(e) {
  if (e.key === "Enter") login();
}
function handleRegisterKey(e) {
  if (e.key === "Enter") register();
}

/* ── INIT ── */

window.addEventListener("DOMContentLoaded", () => {
  applyTheme(localStorage.getItem("theme") || "light");
  applyLanguage();
  checkPremium();

  // Fast path: show menu immediately from cached localStorage
  if (localStorage.getItem("loggedIn") === "true") {
    const menuPage = document.getElementById("menuPage");
    if (menuPage) showMenu();
  }

  // Firebase Auth state listener (only on pages that loaded firebase.js)
  if (typeof _auth !== "undefined") {
    _auth.onAuthStateChanged(async (user) => {
      if (user && !user.isAnonymous) {
        // Re-sync premium/role from Firestore — prevents localStorage tampering
        const data = await _syncUserFromFirestore(user.uid);
        if (data) {
          const menuPage = document.getElementById("menuPage");
          if (menuPage && !menuPage.classList.contains("hidden")) showMenu();
        }
      } else if (
        !user &&
        localStorage.getItem("loggedIn") === "true" &&
        localStorage.getItem("username") !== "guest"
      ) {
        // Firebase says logged out but localStorage says logged in → clear
        localStorage.clear();
        location.reload();
      }
    });
  }
});
