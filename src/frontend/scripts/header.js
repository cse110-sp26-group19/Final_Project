async function loadHeader() {
  const placeholder = document.getElementById("site-header");
  if (!placeholder) return;
  const base = document.querySelector('meta[name="base-path"]')?.content ?? "";
  const res = await fetch(`${base}/components/header.html`);
  placeholder.outerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", loadHeader);
