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
}

document.addEventListener("DOMContentLoaded", loadHeader);
