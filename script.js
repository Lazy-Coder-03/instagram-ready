// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');
const downloadAllBtn = document.getElementById('downloadAll');
const clearAllBtn = document.getElementById('clearAll');
const processing = document.getElementById('processing');
const stats = document.getElementById('stats');
const borderColorInput = document.getElementById('borderColor');
const aspectRatioSelect = document.getElementById('aspectRatio');
const outputFormatSelect = document.getElementById('outputFormat');

// Editor Elements
const editorModal = document.getElementById('editorModal');
const editorCanvas = document.getElementById('editorCanvas');
const editorClose = document.getElementById('editorClose');
const editorCancel = document.getElementById('editorCancel');
const editorReset = document.getElementById('editorReset');
const editorApply = document.getElementById('editorApply');
const rotateLeftBtn = document.getElementById('rotateLeft');
const rotateRightBtn = document.getElementById('rotateRight');
const flipHBtn = document.getElementById('flipH');
const flipVBtn = document.getElementById('flipV');
const zoomSlider = document.getElementById('zoomSlider');

// Aspect ratio definitions
const ASPECT_RATIOS = {
  '1:1': { width: 1, height: 1 },
  '4:5': { width: 4, height: 5 },
  '9:16': { width: 9, height: 16 }
};

// State
let processedImages = [];
let originalImages = [];

// Editor State
let currentEditIndex = -1;
let editorState = {
  rotation: 0,
  zoom: 100,
  offsetX: 0,
  offsetY: 0,
  flipH: false,
  flipV: false
};
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let currentOriginalImage = null;

// Setup global settings events
function setupSettings() {
  const inputs = [borderColorInput, aspectRatioSelect, outputFormatSelect];
  
  inputs.forEach(input => {
    input.addEventListener('change', async () => {
      if (originalImages.length === 0) return;
      
      showProcessing(true);
      
      // Reprocess all images with new settings
      for (let i = 0; i < originalImages.length; i++) {
        URL.revokeObjectURL(processedImages[i].url);
        const result = await processImage(originalImages[i], originalImages[i].editorState);
        processedImages[i] = result;
      }
      
      showProcessing(false);
      renderGallery();
    });
  });
}

// Initialize
function init() {
  setupUploadZone();
  setupButtons();
  setupSettings();
  setupEditor();
}

// Setup upload zone events
function setupUploadZone() {
  uploadZone.addEventListener('click', () => fileInput.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });
}

// Setup button events
function setupButtons() {
  downloadAllBtn.addEventListener('click', downloadAll);
  clearAllBtn.addEventListener('click', clearAll);
}

// Setup editor events
function setupEditor() {
  editorClose.addEventListener('click', closeEditor);
  editorCancel.addEventListener('click', closeEditor);
  editorReset.addEventListener('click', resetEditor);
  editorApply.addEventListener('click', applyEdits);

  rotateLeftBtn.addEventListener('click', () => rotate(-90));
  rotateRightBtn.addEventListener('click', () => rotate(90));

  flipHBtn.addEventListener('click', () => {
    editorState.flipH = !editorState.flipH;
    renderEditorCanvas();
  });

  flipVBtn.addEventListener('click', () => {
    editorState.flipV = !editorState.flipV;
    renderEditorCanvas();
  });

  zoomSlider.addEventListener('input', (e) => {
    editorState.zoom = parseInt(e.target.value);
    renderEditorCanvas();
  });

  // Mouse events for dragging
  editorCanvas.addEventListener('mousedown', startDrag);
  editorCanvas.addEventListener('mousemove', drag);
  editorCanvas.addEventListener('mouseup', endDrag);
  editorCanvas.addEventListener('mouseleave', endDrag);

  // Touch events for mobile
  editorCanvas.addEventListener('touchstart', startDragTouch, { passive: false });
  editorCanvas.addEventListener('touchmove', dragTouch, { passive: false });
  editorCanvas.addEventListener('touchend', endDrag);
}

// Handle file selection
async function handleFiles(files) {
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (!imageFiles.length) return;

  showProcessing(true);

  for (const file of imageFiles) {
    try {
      const originalData = await loadImageData(file);
      originalImages.push(originalData);

      const result = await processImage(originalData, getDefaultEditorState());
      processedImages.push(result);
    } catch (err) {
      console.error('Failed to process:', file.name, err);
    }
  }

  showProcessing(false);
  renderGallery();
}

// Load image data from file
function loadImageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          name: file.name,
          type: file.type, // Store original mime type
          dataUrl: e.target.result,
          width: img.width,
          height: img.height,
          image: img,
          editorState: getDefaultEditorState()
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Get default editor state
function getDefaultEditorState() {
  return {
    rotation: 0,
    zoom: 100,
    offsetX: 0,
    offsetY: 0,
    flipH: false,
    flipV: false
  };
}

// Get canvas dimensions based on aspect ratio and image
function getCanvasDimensions(imgWidth, imgHeight) {
  const ratio = ASPECT_RATIOS[aspectRatioSelect.value];
  const targetRatio = ratio.width / ratio.height;
  const imgRatio = imgWidth / imgHeight;

  let canvasWidth, canvasHeight;

  if (imgRatio > targetRatio) {
    // Image is wider than target ratio
    canvasWidth = imgWidth;
    canvasHeight = imgWidth / targetRatio;
  } else {
    // Image is taller than target ratio
    canvasHeight = imgHeight;
    canvasWidth = imgHeight * targetRatio;
  }

  return { width: Math.round(canvasWidth), height: Math.round(canvasHeight) };
}

// Process image with editor state
function processImage(originalData, state) {
  return new Promise((resolve) => {
    const img = originalData.image;
    const isRotated = state.rotation % 180 !== 0;
    const imgWidth = isRotated ? img.height : img.width;
    const imgHeight = isRotated ? img.width : img.height;

    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(imgWidth, imgHeight);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');

    // Fill with border color
    ctx.fillStyle = borderColorInput.value;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Apply transformations
    const scale = state.zoom / 100;

    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);

    // Apply flips
    const scaleX = state.flipH ? -1 : 1;
    const scaleY = state.flipV ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(
      img,
      -img.width / 2 + state.offsetX / scale,
      -img.height / 2 + state.offsetY / scale
    );
    ctx.restore();

    const targetFormat = outputFormatSelect.value === 'auto' ? originalData.type : outputFormatSelect.value;
    const quality = targetFormat === 'image/jpeg' || targetFormat === 'image/webp' ? 1.0 : undefined; // Use max quality for lossy formats

    canvas.toBlob((blob) => {
      resolve({
        name: generateFileName(originalData.name, targetFormat),
        blob: blob,
        url: URL.createObjectURL(blob)
      });
    }, targetFormat, quality);
  });
}

// Generate output filename
function generateFileName(originalName, mimeType) {
  const baseName = originalName.replace(/\.[^.]+$/, '');
  const ratio = aspectRatioSelect.value.replace(':', 'x');
  
  let ext;
  if (mimeType === 'image/jpeg') ext = 'jpg';
  else if (mimeType === 'image/png') ext = 'png';
  else if (mimeType === 'image/webp') ext = 'webp';
  else ext = 'jpg'; // Default fallback

  return `${baseName}_${ratio}.${ext}`;
}

// Show/hide processing overlay
function showProcessing(show) {
  processing.classList.toggle('hidden', !show);
}

// Render gallery
function renderGallery() {
  const hasImages = processedImages.length > 0;

  downloadAllBtn.disabled = !hasImages;
  clearAllBtn.disabled = !hasImages;

  stats.textContent = hasImages
    ? `${processedImages.length} image${processedImages.length > 1 ? 's' : ''} ready`
    : '';

  if (!hasImages) {
    gallery.innerHTML = '<div class="empty-state">No images yet</div>';
    return;
  }

  gallery.innerHTML = processedImages.map((img, i) => `
    <div class="image-card" data-index="${i}">
      <img src="${img.url}" alt="${img.name}" onclick="openEditor(${i})">
      <div class="edit-hint" onclick="openEditor(${i})">Tap to edit</div>
      <button class="remove-single" onclick="event.stopPropagation(); removeImage(${i})" title="Remove">&#215;</button>
      <button class="download-single" onclick="event.stopPropagation(); downloadImage(${i})" title="Download">&#8595;</button>
    </div>
  `).join('');
}

// Open editor for image
function openEditor(index) {
  currentEditIndex = index;
  currentOriginalImage = originalImages[index];
  editorState = { ...currentOriginalImage.editorState };

  zoomSlider.value = editorState.zoom;
  editorModal.classList.remove('hidden');
  renderEditorCanvas();
}

// Close editor
function closeEditor() {
  editorModal.classList.add('hidden');
  currentEditIndex = -1;
  currentOriginalImage = null;
}

// Reset editor to defaults
function resetEditor() {
  editorState = getDefaultEditorState();
  zoomSlider.value = 100;
  renderEditorCanvas();
}

// Rotate image
function rotate(degrees) {
  editorState.rotation = (editorState.rotation + degrees + 360) % 360;
  editorState.offsetX = 0;
  editorState.offsetY = 0;
  renderEditorCanvas();
}

// Render editor canvas
function renderEditorCanvas() {
  if (!currentOriginalImage) return;

  const img = currentOriginalImage.image;
  const isRotated = editorState.rotation % 180 !== 0;
  const imgWidth = isRotated ? img.height : img.width;
  const imgHeight = isRotated ? img.width : img.height;

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(imgWidth, imgHeight);

  // Set canvas size (limited for display)
  const maxDisplaySize = 300;
  const displayRatio = Math.min(maxDisplaySize / canvasWidth, maxDisplaySize / canvasHeight);
  const displayWidth = canvasWidth * displayRatio;
  const displayHeight = canvasHeight * displayRatio;

  editorCanvas.width = displayWidth;
  editorCanvas.height = displayHeight;

  const ctx = editorCanvas.getContext('2d');

  // Fill background
  ctx.fillStyle = borderColorInput.value;
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // Apply transformations
  const scale = (editorState.zoom / 100) * displayRatio;

  ctx.save();
  ctx.translate(displayWidth / 2, displayHeight / 2);

  // Apply flips
  const scaleX = editorState.flipH ? -1 : 1;
  const scaleY = editorState.flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  ctx.rotate((editorState.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(
    img,
    -img.width / 2 + editorState.offsetX / (editorState.zoom / 100),
    -img.height / 2 + editorState.offsetY / (editorState.zoom / 100)
  );
  ctx.restore();
}

// Drag handlers
function startDrag(e) {
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
}

function startDragTouch(e) {
  e.preventDefault();
  isDragging = true;
  dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}

function drag(e) {
  if (!isDragging) return;

  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;

  editorState.offsetX += dx;
  editorState.offsetY += dy;

  dragStart = { x: e.clientX, y: e.clientY };
  renderEditorCanvas();
}

function dragTouch(e) {
  if (!isDragging) return;
  e.preventDefault();

  const dx = e.touches[0].clientX - dragStart.x;
  const dy = e.touches[0].clientY - dragStart.y;

  editorState.offsetX += dx;
  editorState.offsetY += dy;

  dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  renderEditorCanvas();
}

function endDrag() {
  isDragging = false;
}

// Apply edits
async function applyEdits() {
  if (currentEditIndex < 0 || !currentOriginalImage) return;

  showProcessing(true);

  // Save editor state to original
  originalImages[currentEditIndex].editorState = { ...editorState };

  // Reprocess image
  URL.revokeObjectURL(processedImages[currentEditIndex].url);
  const result = await processImage(currentOriginalImage, editorState);
  processedImages[currentEditIndex] = result;

  showProcessing(false);
  closeEditor();
  renderGallery();
}

// Download single image
function downloadImage(index) {
  const img = processedImages[index];
  const link = document.createElement('a');
  link.href = img.url;
  link.download = img.name;
  link.click();
}

// Remove single image
function removeImage(index) {
  URL.revokeObjectURL(processedImages[index].url);
  processedImages.splice(index, 1);
  originalImages.splice(index, 1);
  renderGallery();
}

// Download all images
async function downloadAll() {
  for (let i = 0; i < processedImages.length; i++) {
    downloadImage(i);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Clear all images
function clearAll() {
  processedImages.forEach(img => URL.revokeObjectURL(img.url));
  processedImages = [];
  originalImages = [];
  renderGallery();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
