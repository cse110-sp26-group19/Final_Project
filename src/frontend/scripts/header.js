function initTheme() {
  const saved = localStorage.getItem("memebro-theme");
  if (saved) {
    document.documentElement.setAttribute("data-theme", saved);
  }
}

function updateToggleButton() {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("memebro-theme", next);
  updateToggleButton();
}

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

  const toggleBtn = document.querySelector(".theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleTheme);
    updateToggleButton();
  }
}

initTheme();
document.addEventListener("DOMContentLoaded", loadHeader);
