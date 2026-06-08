/** @type {string} Single source of truth for the current theme. */
let currentTheme = localStorage.getItem("memebro-theme") || "dark";

/**
 * Applies a theme by updating the module state, DOM attribute, and localStorage.
 *
 * @param {string} theme - The theme to apply ('light' or 'dark').
 */
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("memebro-theme", theme);
}

/**
 * Updates the toggle button's aria-label to reflect the current theme.
 */
function updateToggleButton() {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  btn.setAttribute(
    "aria-label",
    currentTheme === "light" ? "Switch to dark mode" : "Switch to light mode"
  );
}

/**
 * Toggles between light and dark mode and updates the toggle button label.
 */
function toggleTheme() {
  applyTheme(currentTheme === "light" ? "dark" : "light");
  updateToggleButton();
}

/**
 * Wires up the theme toggle button after the header is injected into the DOM.
 */
function initToggle() {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", toggleTheme);
  updateToggleButton();
}

/**
 * Fetches and injects header.html into the page, then initializes the theme toggle.
 *
 * @returns {Promise<void>}
 */
async function loadHeader() {
  const placeholder = document.getElementById("site-header");
  if (!placeholder) return;
  const base = window.location.pathname.includes("/pages/") ? ".." : ".";
  const res = await fetch(`${base}/components/header.html`);
  if (!res.ok) {
    console.error("Failed to load header:", res.status);
    return;
  }
  let html = await res.text();
  html = html.replace(/href="\/([^"]*)"/g, `href="${base}/$1"`);
  placeholder.outerHTML = html;
  initToggle();
}

applyTheme(currentTheme);
document.addEventListener("DOMContentLoaded", loadHeader);
