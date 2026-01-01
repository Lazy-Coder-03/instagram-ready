// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');
const downloadAllBtn = document.getElementById('downloadAll');
const clearAllBtn = document.getElementById('clearAll');
const processing = document.getElementById('processing');
const stats = document.getElementById('stats');

// State
let processedImages = [];

// Initialize
function init() {
  setupUploadZone();
  setupButtons();
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

// Handle file selection
async function handleFiles(files) {
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (!imageFiles.length) return;

  showProcessing(true);

  for (const file of imageFiles) {
    try {
      const result = await processImage(file);
      processedImages.push(result);
    } catch (err) {
      console.error('Failed to process:', file.name, err);
    }
  }

  showProcessing(false);
  renderGallery();
}

// Process single image - add black borders to make square
function processImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const size = Math.max(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        // Fill with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);

        // Center the image
        const x = (size - img.width) / 2;
        const y = (size - img.height) / 2;
        ctx.drawImage(img, x, y);

        // Convert to blob
        canvas.toBlob((blob) => {
          resolve({
            name: generateFileName(file.name),
            blob: blob,
            url: URL.createObjectURL(blob)
          });
        }, 'image/jpeg', 0.92);
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Generate output filename
function generateFileName(originalName) {
  const baseName = originalName.replace(/\.[^.]+$/, '');
  return `${baseName}_square.jpg`;
}

// Show/hide processing overlay
function showProcessing(show) {
  processing.classList.toggle('hidden', !show);
}

// Render gallery
function renderGallery() {
  const hasImages = processedImages.length > 0;

  // Update button states
  downloadAllBtn.disabled = !hasImages;
  clearAllBtn.disabled = !hasImages;

  // Update stats
  stats.textContent = hasImages
    ? `${processedImages.length} image${processedImages.length > 1 ? 's' : ''} ready`
    : '';

  // Render gallery content
  if (!hasImages) {
    gallery.innerHTML = '<div class="empty-state">No images yet</div>';
    return;
  }

  gallery.innerHTML = processedImages.map((img, i) => `
    <div class="image-card" data-index="${i}">
      <img src="${img.url}" alt="${img.name}">
      <button class="remove-single" onclick="removeImage(${i})" title="Remove">&#215;</button>
      <button class="download-single" onclick="downloadImage(${i})" title="Download">&#8595;</button>
    </div>
  `).join('');
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
  renderGallery();
}

// Download all images
async function downloadAll() {
  for (let i = 0; i < processedImages.length; i++) {
    downloadImage(i);
    // Small delay between downloads to prevent browser blocking
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Clear all images
function clearAll() {
  processedImages.forEach(img => URL.revokeObjectURL(img.url));
  processedImages = [];
  renderGallery();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
