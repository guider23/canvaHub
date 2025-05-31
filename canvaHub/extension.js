window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('images-container');
  let popupTimeout;
  //bc works 2025
  let isScrolling = false;
  let imageData = [];
  
  // Create popup container
  const popup = document.createElement('div');
  popup.className = 'image-popup';
  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.innerHTML = '<span class="material-icons">close</span>';
  popup.appendChild(closeButton);
  document.body.appendChild(popup);

  // Handle popup close XD
  closeButton.addEventListener('click', () => {
    popup.classList.remove('active');
  });

  // Close popup on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('active')) {
      popup.classList.remove('active');
    }
  });

  // Handle scroll events
  window.addEventListener('scroll', () => {
    isScrolling = true;
    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  });

  // Tools functionality
  document.querySelectorAll('.tool-item').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tool = button.dataset.tool;
      
      switch(tool) {
        case 'filter-resolution':
          showResolutionFilter();
          break;
        case 'filter-format':
          showFormatFilter();
          break;
        case 'filter-domain':
          showDomainFilter();
          break;
        case 'download-all':
          downloadAllImages();
          break;
        case 'download-zip':
          downloadAsZip();
          break;
        case 'export-html':
          exportAsHtml();
          break;
        case 'copy-urls':
          copyAllUrls();
          break;
        case 'show-context':
          showImageContext();
          break;
        case 'cleanup':
          cleanupImages();
          break;
        case 'classify':
          classifyImages();
          break;
        case 'dev-mode':
          toggleDevMode();
          break;
        case 'refresh-urls':
          refreshUrls();
          break;
        case 'screenshot':
          takeScreenshot();
          break;
        case 'upscale':
          upscaleImages();
          break;
      }
    });
  });

  // Function to copy image to clipboard
  async function copyImageToClipboard(url) {
    try {
      // First try to get the image as a blob
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create a ClipboardItem with the blob
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      console.error('Failed to copy image:', err);
      // Try alternative method if the first one fails
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        return true;
      } catch (fallbackErr) {
        console.error('Fallback method also failed:', fallbackErr);
        return false;
      }
    }
  }

  // Tool functions lol some of them doesn't work XD
  function showResolutionFilter() {
    const resolutions = new Set(imageData.map(img => `${img.width}x${img.height}`));
    const filterDialog = document.createElement('div');
    filterDialog.className = 'filter-dialog';
    filterDialog.innerHTML = `
      <h3>
        Filter by Resolution
        <span class="material-icons close-dialog">close</span>
      </h3>
      <div class="filter-options">
        ${Array.from(resolutions).map(res => `
          <label>
            <input type="checkbox" value="${res}">
            <span>${res}</span>
          </label>
        `).join('')}
      </div>
      <button class="apply-filter">
        <span class="material-icons">filter_alt</span>
        Apply Filter
      </button>
    `;

    const closeButton = filterDialog.querySelector('.close-dialog');
    closeButton.addEventListener('click', () => filterDialog.remove());

    const applyButton = filterDialog.querySelector('.apply-filter');
    applyButton.addEventListener('click', () => {
      const selectedResolutions = Array.from(filterDialog.querySelectorAll('input:checked')).map(input => input.value);
      if (selectedResolutions.length === 0) {
        showToast('Please select at least one resolution');
        return;
      }
      filterImages('resolution', selectedResolutions);
      filterDialog.remove();
    });

    document.body.appendChild(filterDialog);
  }

  function showFormatFilter() {
    const formats = new Set(imageData.map(img => img.format));
    const filterDialog = document.createElement('div');
    filterDialog.className = 'filter-dialog';
    filterDialog.innerHTML = `
      <h3>
        Filter by Format
        <span class="material-icons close-dialog">close</span>
      </h3>
      <div class="filter-options">
        ${Array.from(formats).map(format => `
          <label>
            <input type="checkbox" value="${format}">
            <span>${format.toUpperCase()}</span>
          </label>
        `).join('')}
      </div>
      <button class="apply-filter">
        <span class="material-icons">filter_alt</span>
        Apply Filter
      </button>
    `;

    const closeButton = filterDialog.querySelector('.close-dialog');
    closeButton.addEventListener('click', () => filterDialog.remove());

    const applyButton = filterDialog.querySelector('.apply-filter');
    applyButton.addEventListener('click', () => {
      const selectedFormats = Array.from(filterDialog.querySelectorAll('input:checked')).map(input => input.value);
      if (selectedFormats.length === 0) {
        showToast('Please select at least one format');
        return;
      }
      filterImages('format', selectedFormats);
      filterDialog.remove();
    });

    document.body.appendChild(filterDialog);
  }

  function showDomainFilter() {
    const domains = new Set(imageData.map(img => new URL(img.src).hostname));
    const filterDialog = document.createElement('div');
    filterDialog.className = 'filter-dialog';
    filterDialog.innerHTML = `
      <h3>
        Filter by Domain
        <span class="material-icons close-dialog">close</span>
      </h3>
      <div class="filter-options">
        ${Array.from(domains).map(domain => `
          <label>
            <input type="checkbox" value="${domain}">
            <span>${domain}</span>
          </label>
        `).join('')}
      </div>
      <button class="apply-filter">
        <span class="material-icons">filter_alt</span>
        Apply Filter
      </button>
    `;

    const closeButton = filterDialog.querySelector('.close-dialog');
    closeButton.addEventListener('click', () => filterDialog.remove());

    const applyButton = filterDialog.querySelector('.apply-filter');
    applyButton.addEventListener('click', () => {
      const selectedDomains = Array.from(filterDialog.querySelectorAll('input:checked')).map(input => input.value);
      if (selectedDomains.length === 0) {
        showToast('Please select at least one domain');
        return;
      }
      filterImages('domain', selectedDomains);
      filterDialog.remove();
    });

    document.body.appendChild(filterDialog);
  }

  // Keyboard Shortcuts and Search
  const searchInput = document.getElementById('image-search');
  let searchActive = false;
  let lastSearch = '';

  // Show search bar on /, focus, and filter images
  window.addEventListener('keydown', (e) => {
    // Ctrl+Shift+C → Copy all
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
      e.preventDefault();
      copyAllUrls();
      showToast('All image URLs copied!');
      return;
    }
    // / to search
    if (e.key === '/' && !searchActive && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.style.display = 'block';
      searchInput.focus();
      searchActive = true;
      searchInput.value = '';
      filterImages('search', []);
      return;
    }
    // Escape to exit search
    if (e.key === 'Escape' && searchActive) {
      searchInput.value = '';
      searchInput.style.display = 'none';
      searchActive = false;
      filterImages('search', []);
      return;
    }
    // Modal navigation
    if (document.querySelector('.image-popup.active')) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateModal(-1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateModal(1);
        return;
      }
    }
  });

  // Live search filter
  searchInput && searchInput.addEventListener('input', () => {
    lastSearch = searchInput.value.trim().toLowerCase();
    filterImages('search', []);
  });

  // Modal navigation logic
  let currentModalIndex = -1;
  function navigateModal(direction) {
    const visibleCards = Array.from(document.querySelectorAll('.image-card')).filter(card => card.style.display !== 'none');
    if (visibleCards.length === 0) return;
    if (currentModalIndex === -1) {
      currentModalIndex = 0;
    } else {
      currentModalIndex = (currentModalIndex + direction + visibleCards.length) % visibleCards.length;
    }
    const img = visibleCards[currentModalIndex].querySelector('img');
    if (img) {
      const popup = document.querySelector('.image-popup');
      const closeButton = popup.querySelector('.close-button');
      const popupImg = document.createElement('img');
      popupImg.src = img.src;
      popupImg.crossOrigin = 'anonymous';
      const existingImg = popup.querySelector('img');
      if (existingImg) existingImg.remove();
      popup.insertBefore(popupImg, closeButton);
      popup.classList.add('active');
    }
  }

  // Update image card click to set currentModalIndex
  function setModalIndexBySrc(src) {
    const visibleCards = Array.from(document.querySelectorAll('.image-card')).filter(card => card.style.display !== 'none');
    currentModalIndex = visibleCards.findIndex(card => card.querySelector('img').src === src);
  }

  function filterImages(type, selectedValues) {
    const cards = document.querySelectorAll('.image-card');
    let visibleCount = 0;
    cards.forEach((card, index) => {
      const img = imageData[index];
      let shouldShow = false;
      switch(type) {
        case 'resolution':
          const resolution = `${img.width}x${img.height}`;
          shouldShow = selectedValues.includes(resolution);
          break;
        case 'format':
          shouldShow = selectedValues.includes(img.format);
          break;
        case 'domain':
          const domain = new URL(img.src).hostname;
          shouldShow = selectedValues.includes(domain);
          break;
        case 'search':
          if (!lastSearch) {
            shouldShow = true;
          } else {
            shouldShow = (img.src && img.src.toLowerCase().includes(lastSearch));
          }
          break;
        default:
          shouldShow = true;
      }
      card.style.display = shouldShow ? 'block' : 'none';
      if (shouldShow) visibleCount++;
    });
    updateImageCountTitle(visibleCount);
    if (visibleCount === 0) {
      showToast('No images match the selected filters');
    } else if (type === 'search') {
      showToast(`Found ${visibleCount} images`);
    }
  }

  // Add click outside to close filter dialog
  document.addEventListener('click', (e) => {
    const filterDialog = document.querySelector('.filter-dialog');
    if (filterDialog && !filterDialog.contains(e.target) && !e.target.closest('.tool-item')) {
      filterDialog.remove();
    }
  });

  async function downloadAllImages() {
    for (const img of imageData) {
      const a = document.createElement('a');
      a.href = img.src;
      a.download = `canva-image-${img.width}x${img.height}.${img.format}`;
      a.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async function downloadAsZip() {
    const zip = new JSZip();
    const promises = imageData.map(async (img, index) => {
      const response = await fetch(img.src);
      const blob = await response.blob();
      zip.file(`image-${index + 1}-${img.width}x${img.height}.${img.format}`, blob);
    });
    
    await Promise.all(promises);
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'canva-images.zip';
    a.click();
  }

  function exportAsHtml() {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Canva Images Gallery</title>
          <style>
            body { font-family: sans-serif; margin: 20px; }
            .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
            .image-card { border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
            img { max-width: 100%; height: auto; }
            .info { margin-top: 10px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Canva Images Gallery</h1>
          <div class="gallery">
            ${imageData.map(img => `
              <div class="image-card">
                <img src="${img.src}" alt="Canva Image">
                <div class="info">
                  <p>Size: ${img.width}x${img.height}</p>
                  <p>Format: ${img.format}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'canva-gallery.html';
    a.click();
  }

  function copyAllUrls() {
    const urls = imageData.map(img => `[${img.width}x${img.height}](${img.src})`).join('\n');
    navigator.clipboard.writeText(urls);
    showToast('All URLs copied to clipboard!');
  }

  function showImageContext() {
    // Implementation for showing image context
    showToast('Image context feature coming soon!');
  }

  function cleanupImages() {
    // Implementation for smart cleanup
    showToast('Cleanup feature coming soon!');
  }

  function classifyImages() {
    // Implementation for image classification
    showToast('Classification feature coming soon!');
  }

  function toggleDevMode() {
    // Implementation for dev mode
    showToast('Dev mode coming soon!');
  }

  function refreshUrls() {
    // Implementation for URL refresh
    showToast('URL refresh feature coming soon!');
  }

  function takeScreenshot() {
    // Implementation for screenshot
    showToast('Screenshot feature coming soon!');
  }

  function upscaleImages() {
    // Implementation for AI upscale
    showToast('AI upscale feature coming soon!');
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function updateImageCountTitle(count) {
    const title = document.getElementById('image-count-title');
    title.textContent = `Found ${count} Premium Canva Image${count === 1 ? '' : 's'}`;
  }

  chrome.storage.local.get('canvaImages', async data => {
    const urls = data.canvaImages || [];
    updateImageCountTitle(urls.length);
    if (urls.length === 0) {
      container.innerHTML = '<p>No images found on this page.</p>';
      return;
    }

    for (const src of urls) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        imageData.push({
          src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: src.split('.').pop().toLowerCase()
        });
      };
      
      img.src = src;

      const card = document.createElement('div');
      card.className = 'image-card';

      const imgElement = document.createElement('img');
      imgElement.src = src;
      imgElement.crossOrigin = 'anonymous';
      
      imgElement.onload = () => {
        card.classList.add('loaded');
        const dimensions = document.createElement('div');
        dimensions.className = 'image-dimensions';
        dimensions.textContent = `${imgElement.naturalWidth}x${imgElement.naturalHeight}`;
        card.appendChild(dimensions);
      };

      // Add click handler for popup
      card.addEventListener('click', (e) => {
        if (isScrolling) return;
        if (e.target.closest('.copy-button')) return;
        setModalIndexBySrc(src);
        const popupImg = document.createElement('img');
        popupImg.src = src;
        popupImg.crossOrigin = 'anonymous';
        // Clear existing image
        const existingImg = popup.querySelector('img');
        if (existingImg) {
          existingImg.remove();
        }
        popup.insertBefore(popupImg, closeButton);
        popup.classList.add('active');
      });
      
      card.appendChild(imgElement);

      const btnContainer = document.createElement('div');
      btnContainer.className = 'button-container';

      const copyImageBtn = document.createElement('button');
      copyImageBtn.className = 'copy-button';
      copyImageBtn.innerHTML = '<span class="material-icons">content_copy</span>';
      copyImageBtn.title = 'Copy Image';
      
      copyImageBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          copyImageBtn.innerHTML = '<span class="material-icons">hourglass_empty</span>';
          const success = await copyImageToClipboard(src);
          
          if (success) {
            copyImageBtn.innerHTML = '<span class="material-icons">check</span>';
            copyImageBtn.classList.add('success');
          } else {
            copyImageBtn.innerHTML = '<span class="material-icons">download</span>';
            copyImageBtn.classList.add('error');
            copyImageBtn.title = 'Click to download instead';
            
            copyImageBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              const a = document.createElement('a');
              a.href = src;
              a.download = 'canva-image.png';
              a.click();
            }, { once: true });
          }
          
          setTimeout(() => {
            copyImageBtn.innerHTML = '<span class="material-icons">content_copy</span>';
            copyImageBtn.classList.remove('success', 'error');
            copyImageBtn.title = 'Copy Image';
          }, 2000);
        } catch (error) {
          console.error('Error in click handler:', error);
          copyImageBtn.innerHTML = '<span class="material-icons">error</span>';
          copyImageBtn.classList.add('error');
        }
      });
      
      btnContainer.appendChild(copyImageBtn);
      card.appendChild(btnContainer);
      container.appendChild(card);
    }
  });

  // Dark mode toggle logic
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;

  function setDarkMode(enabled) {
    if (enabled) {
      body.classList.add('dark-mode');
      localStorage.setItem('darkMode', '1');
    } else {
      body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', '0');
    }
  }

  darkModeToggle.addEventListener('click', () => {
    setDarkMode(!body.classList.contains('dark-mode'));
  });

  // On load, set dark mode if previously enabled
  if (localStorage.getItem('darkMode') === '1') {
    setDarkMode(true);
  }
});
//lol end
