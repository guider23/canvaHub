console.log('Content script loaded');
// bc works 2025
// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getImages') {
    try {
      // Grab all image elements and filter out only Canva-hosted ones
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(src => src.startsWith('https://media-public.canva.com'));

      sendResponse({ images: images });
    } catch (error) {
      // In case something breaks, return the error message
      sendResponse({ error: error.message });
    }

    return true; // Let Chrome know we're sending the response asynchronously
  }
});

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
