console.log('[CanvaHub] Content script loaded');

// Ensure we only register the listener once
if (!window.canvaHubListenerRegistered) {
  window.canvaHubListenerRegistered = true;
  
  // Listen for messages from the popup or background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('[CanvaHub] Content script received message:', request);
    
    if (request.action === 'test') {
      console.log('[CanvaHub] Test message received');
      sendResponse({ status: 'content script working', timestamp: Date.now() });
      return true;
    }
    
    if (request.action === 'getImages') {
      // Remove setTimeout - it breaks message response
      try {
        // Grab all image elements and filter out only Canva-hosted ones
        const allImages = document.querySelectorAll('img');
        console.log('[CanvaHub] Total images found:', allImages.length);
        
        const canvaImages = Array.from(allImages)
          .map(img => {
            // Get both src and data-src for lazy-loaded images
            return img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
          })
          .filter(src => src && (
            src.startsWith('https://media-public.canva.com') ||
            (src.includes('canva.com') && src.includes('media'))
          ))
          .filter((src, index, array) => array.indexOf(src) === index); // Remove duplicates

        console.log('[CanvaHub] Canva images found:', canvaImages.length, canvaImages);
        sendResponse({ images: canvaImages });
      } catch (error) {
        console.error('[CanvaHub] Error getting images:', error);
        sendResponse({ error: error.message });
      }

      return true; // Let Chrome know we're sending the response asynchronously
    }
  });
}

// Display a floating toast message on the screen
function showCanvaExtractToast(msg) {
  // Remove existing toast if any
  let toast = document.getElementById('canva-extract-toast');
  if (toast) toast.remove();

  // Create a new toast element
  toast = document.createElement('div');
  toast.id = 'canva-extract-toast';
  toast.textContent = msg;

  // Style it like a subtle floating notification
  toast.style.position = 'fixed';
  toast.style.bottom = '80px';
  toast.style.right = '40px';
  toast.style.background = '#23272a';
  toast.style.color = '#fff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '15px';
  toast.style.fontWeight = '500';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
  toast.style.zIndex = '99999';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s';

  // Add it to the page
  document.body.appendChild(toast);
//Aesthetics matters 🤣
  // Fade in, wait a bit, then fade out and remove
  setTimeout(() => { toast.style.opacity = '1'; }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2200);
}

// Add a global function to test if content script is working
window.canvaHubTest = function() {
  console.log('[CanvaHub] Content script test function called');
  return { status: 'working', timestamp: Date.now() };
};

// Log when content script is fully ready
setTimeout(() => {
  console.log('[CanvaHub] Content script fully initialized');
}, 100);
