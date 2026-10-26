/* Load before styles so every page starts with the saved appearance. */
(() => {
  const root = document.documentElement;
  const normalize = (theme) => theme === "dark" ? "dark" : "light";

  function read() {
    try {
      return normalize(localStorage.getItem("theme"));
    } catch (_) {
      return normalize(root.dataset.theme);
    }
  }

  function render(theme) {
    root.dataset.theme = normalize(theme);
    root.style.colorScheme = root.dataset.theme;
    if (typeof _updateThemeBtn === "function") _updateThemeBtn();
  }

  function sync() {
    render(read());
  }

  function set(theme) {
    const next = normalize(theme);
    try { localStorage.setItem("theme", next); } catch (_) {}
    render(next);
  }

  window.SutaTheme = Object.freeze({ set, sync });
  sync();
  // Back/forward may restore a page without running DOMContentLoaded again.
  window.addEventListener("pageshow", sync);
  window.addEventListener("storage", (event) => {
    if (event.key === "theme" || event.key === null) sync();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") sync();
  });
})();
