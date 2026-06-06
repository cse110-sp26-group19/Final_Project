import {
  FACE_KEY,
  enforceGuard,
  getSelectedTemplate,
  renderStepIndicator,
} from "../lib/session-state.js";

const zone = document.getElementById("upload-zone");
const input = document.getElementById("file-input");
const cameraInput = document.getElementById("camera-input");
const nextBtn = document.getElementById("next-btn");
const preview = document.getElementById("upload-preview");
const ALLOWED = ["image/jpeg", "image/png", "image/heic"];

// Flexible order: upload is always reachable. Reflect progress in the indicator.
enforceGuard("upload");
renderStepIndicator("upload");

function handleFile(file) {
  if (!file || !ALLOWED.includes(file.type.toLowerCase())) {
    alert("Please upload a JPG, PNG, or HEIC file.");
    return;
  }

  // Blob URLs are tab-local and die on navigation; convert to a base64 data
  // URL so the edit page can read it from sessionStorage after the redirect.
  const reader = new FileReader();
  reader.onload = (e) => sessionStorage.setItem(FACE_KEY, e.target.result);
  reader.readAsDataURL(file);

  preview.src = URL.createObjectURL(file);
  zone.classList.add("has-file");
  // If a template was already picked, skip straight to edit; otherwise go pick one.
  nextBtn.href = getSelectedTemplate() ? "edit.html" : "templates.html";
  nextBtn.removeAttribute("disabled");
  nextBtn.removeAttribute("aria-disabled");
}

zone.addEventListener("dragover", (e) => {
  e.preventDefault();
  zone.classList.add("drag-over");
});

zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));

zone.addEventListener("drop", (e) => {
  e.preventDefault();
  zone.classList.remove("drag-over");
  handleFile(e.dataTransfer.files[0]);
});

zone.addEventListener("click", () => input.click());

input.addEventListener("change", () => handleFile(input.files[0]));

document.getElementById("choose-file-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  input.click();
});

document.getElementById("camera-btn").addEventListener("click", () => cameraInput.click());
document.getElementById("library-btn").addEventListener("click", () => input.click());
cameraInput.addEventListener("change", () => handleFile(cameraInput.files[0]));
