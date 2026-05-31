/**
 * Face Swap UI Controller
 * Handles the multi-face swap workflow in the browser
 */

const sourceInput = document.getElementById('sourceImage');
const targetInput = document.getElementById('targetImage');
const detectBtn = document.getElementById('detectBtn');
const swapBtn = document.getElementById('swapBtn');
const detectionStatus = document.getElementById('detectionStatus');
const swapStatus = document.getElementById('swapStatus');
const targetCanvas = document.getElementById('targetCanvas');
const faceCount = document.getElementById('faceCount');
const swapResults = document.getElementById('swapResults');
const detectionResults = document.getElementById('detectionResults');

let sourceFile = null;
let targetFile = null;
let targetCanvasData = null;
let detectedFaces = [];
let modelsLoaded = false;

sourceInput.addEventListener('change', (e) => {
  sourceFile = e.target.files[0];
  updateStatus('Source image loaded', 'info', detectionStatus);
});

targetInput.addEventListener('change', (e) => {
  targetFile = e.target.files[0];
  updateStatus('Target image loaded', 'info', detectionStatus);
});

detectBtn.addEventListener('click', detectFaces);
swapBtn.addEventListener('click', performSwap);

function updateStatus(message, type, element) {
  element.textContent = message;
  element.className = `status show ${type}`;
}

async function loadModels() {
  if (modelsLoaded) return;
  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  } catch (error) {
    throw new Error(`Failed to load face detection models: ${error.message}`);
  }
}

async function detectFaces() {
  if (!sourceFile || !targetFile) {
    updateStatus('Please select both images', 'error', detectionStatus);
    return;
  }

  detectBtn.disabled = true;
  updateStatus('Loading models (first time only)...', 'info', detectionStatus);

  try {
    await loadModels();

    updateStatus('Detecting faces...', 'info', detectionStatus);
    const targetImg = await loadImageFile(targetFile);
    targetCanvasData = targetImg;

    const detections = await faceapi
      .detectAllFaces(targetImg, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    detectedFaces = detections.map((det) => ({
      box: {
        x: Math.floor(det.detection.box.x),
        y: Math.floor(det.detection.box.y),
        width: Math.floor(det.detection.box.width),
        height: Math.floor(det.detection.box.height),
      },
      score: det.detection.score,
    }));

    if (detectedFaces.length === 0) {
      updateStatus('No faces detected', 'error', detectionStatus);
      detectBtn.disabled = false;
      return;
    }

    drawDetectedFaces(targetImg, detectedFaces);

    updateStatus(`Found ${detectedFaces.length} face(s)`, 'success', detectionStatus);
    faceCount.textContent = `Detected: ${detectedFaces.length} face(s)`;
    detectionResults.style.display = 'grid';
    swapBtn.disabled = false;

  } catch (error) {
    updateStatus(`Detection failed: ${error.message}`, 'error', detectionStatus);
    console.error(error);
  } finally {
    detectBtn.disabled = false;
  }
}

function drawDetectedFaces(img, faces) {
  const canvas = document.getElementById('targetCanvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 3;
  ctx.font = '16px Arial';
  ctx.fillStyle = '#00ff00';

  faces.forEach((face, idx) => {
    const { x, y, width, height } = face.box;
    ctx.strokeRect(x, y, width, height);
    ctx.fillText(`Face ${idx + 1}`, x + 5, y - 5);
  });
}

async function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function performSwap() {
  if (!sourceFile || !targetFile || detectedFaces.length === 0) {
    updateStatus('Please complete detection first', 'error', swapStatus);
    return;
  }

  swapBtn.disabled = true;
  swapResults.innerHTML = '';
  updateStatus(`Swapping ${detectedFaces.length} face(s)...`, 'info', swapStatus);

  try {
    const cropPromises = detectedFaces.map((face, idx) =>
      cropFace(targetCanvasData, face.box, 20).then((blob) => ({ blob, idx: idx + 1, originalBox: face.box }))
    );
    const croppedFaces = await Promise.all(cropPromises);

    const swappedFaces = [];
    for (let i = 0; i < croppedFaces.length; i++) {
      const { blob, idx, originalBox } = croppedFaces[i];
      try {
        updateStatus(`Swapping face ${i + 1}/${croppedFaces.length}...`, 'info', swapStatus);
        const result = await swapFace(sourceFile, blob, idx);
        swappedFaces.push({
          ...result,
          originalBox: originalBox,
        });
        if (i < croppedFaces.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn(`Face ${idx} swap failed:`, error.message);
      }
    }

    if (swappedFaces.length === 0) {
      updateStatus('All face swaps failed', 'error', swapStatus);
    } else {
      updateStatus('Compositing results...', 'info', swapStatus);
      const compositeCanvas = await compositeSwappedFaces(targetCanvasData, swappedFaces);
      displayCompositeResult(compositeCanvas);
      updateStatus(`Successfully swapped ${swappedFaces.length}/${detectedFaces.length} faces`, 'success', swapStatus);
    }
  } catch (error) {
    updateStatus(`Swap failed: ${error.message}`, 'error', swapStatus);
    console.error(error);
  } finally {
    swapBtn.disabled = false;
  }
}

async function cropFace(img, boundingBox, padding = 20) {
  const { x, y, width, height } = boundingBox;

  const startX = Math.max(0, x - padding);
  const startY = Math.max(0, y - padding);
  const endX = Math.min(img.width, x + width + padding);
  const endY = Math.min(img.height, y + height + padding);

  const cropWidth = endX - startX;
  const cropHeight = endY - startY;

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;

  const ctx = cropCanvas.getContext('2d');
  ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return new Promise((resolve, reject) => {
    cropCanvas.toBlob((blob) => {
      blob ? resolve(blob) : reject(new Error('Failed to crop'));
    }, 'image/png');
  });
}

async function swapFace(sourceFile, targetBlob, faceIndex) {
  const formData = new FormData();
  formData.append('sourceImage', sourceFile);
  formData.append('targetImage', new File([targetBlob], `face-${faceIndex}.png`, { type: 'image/png' }));

  console.log(`Swapping face ${faceIndex}...`);

  try {
    const response = await fetch('http://localhost:3001/api/swap', {
      method: 'POST',
      body: formData,
    });

    console.log(`Face ${faceIndex} response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Face ${faceIndex} error response:`, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Face ${faceIndex} result:`, data);

    if (!data.success) {
      throw new Error(data.error || 'Swap failed');
    }

    return {
      faceIndex,
      ...data.result,
    };
  } catch (error) {
    console.error(`Face ${faceIndex} swap error:`, error);
    throw error;
  }
}

async function compositeSwappedFaces(originalImg, swappedFaces) {
  const canvas = document.createElement('canvas');
  canvas.width = originalImg.width;
  canvas.height = originalImg.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(originalImg, 0, 0);

  for (const face of swappedFaces) {
    const { outputPath, originalBox } = face;
    const padding = 20;
    const { x, y, width, height } = originalBox;

    const startX = Math.max(0, x - padding);
    const startY = Math.max(0, y - padding);
    const endX = Math.min(originalImg.width, x + width + padding);
    const endY = Math.min(originalImg.height, y + height + padding);

    const drawWidth = endX - startX;
    const drawHeight = endY - startY;

    try {
      const response = await fetch(outputPath);
      const blob = await response.blob();
      const img = new Image();

      await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          ctx.drawImage(img, startX, startY, drawWidth, drawHeight);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    } catch (error) {
      console.warn(`Failed to composite face: ${error.message}`);
    }
  }

  return canvas;
}

function displayCompositeResult(canvas) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.borderRadius = '4px';
    img.style.marginTop = '10px';

    swapResults.innerHTML = `
      <div style="text-align: center;">
        <h3 style="color: #555; margin-bottom: 15px;">Final Result</h3>
        ${img.outerHTML}
        <div style="margin-top: 15px;">
          <a href="${url}" download="face-swap-result.png" class="download-btn">Download Result</a>
        </div>
      </div>
    `;
  });
}
