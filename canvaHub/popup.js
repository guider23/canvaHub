// popup.js - currently unused
// this sucks i will remove it later

// Function to update the text of the extract button
function updateButtonText(imageCount) {
  const buttonTextSpan = document.querySelector('#extract .button-text');
  if (buttonTextSpan) {
    if (imageCount > 0) {
      buttonTextSpan.textContent = `Extract ${imageCount} Image${imageCount === 1 ? '' : 's'}`;
    } else {
      buttonTextSpan.textContent = 'Extract Images';
    }
  }
}

// Use MutationObserver to watch for images being added to the body
const observer = new MutationObserver(() => {
  const currentImages = Array.from(document.querySelectorAll('img'))
    .filter(img => img.src.startsWith('https://media-public.canva.com'));
  updateButtonText(currentImages.length);
});

// Start observing the document body for child list changes
observer.observe(document.body, { childList: true, subtree: true });

document.getElementById('extract').addEventListener('click', async () => {
  const button = document.getElementById('extract');
  const status = document.getElementById('status');
  
  button.classList.add('loading');
  button.querySelector('.button-text').textContent = 'Extracting...';
  status.textContent = '';
  status.className = 'status';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }

    if (!tab.url.includes('canva.com')) {
      status.textContent = 'Please open a Canva page first';
      status.className = 'status error';
      button.classList.remove('loading'); // Stop loading animation
      updateButtonText(0); // Reset button text
      return;
    }

    // Send message to content script to get images
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getImages' });
    
    if (chrome.runtime.lastError) {
      throw new Error('Content script not loaded or communication error. Please refresh the Canva page and try again.');
    }
    
    if (response.error) {
      throw new Error(response.error);
    }

    const urls = response.images || [];
    
    if (urls.length === 0) {
      status.textContent = 'No Canva images found. Try refreshing the page.';
      status.className = 'status error';
      button.classList.remove('loading'); // Stop loading animation
      updateButtonText(0); // Reset button text
      return;
    }
    
    await chrome.storage.local.set({ canvaImages: urls });
    
    const page = chrome.runtime.getURL('extension.html');
    await chrome.tabs.create({ url: page });
    
    status.textContent = `Found ${urls.length} image${urls.length === 1 ? '' : 's'}`;
    status.className = 'status success';
    button.classList.remove('loading'); // Stop loading animation
    updateButtonText(urls.length); // Update button with found count
  } catch (error) {
    console.error('Error:', error);
    let errorMessage = error.message;
    
    if (errorMessage.includes('Content script not loaded') || 
        errorMessage.includes('No response from content script')) {
      errorMessage = 'Please refresh the Canva page and try again';
    }
    
    status.textContent = errorMessage;
    status.className = 'status error';
    button.classList.remove('loading'); // Stop loading animation
    updateButtonText(0); // Reset button text
  }
});
