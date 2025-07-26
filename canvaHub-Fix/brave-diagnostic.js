console.log('=== Brave Browser Canva Hub Diagnostic ===');
function isBrave() {
  return (navigator.brave && navigator.brave.isBrave) || /Brave/.test(navigator.userAgent);
}
console.log('Browser detection:');
console.log('- Is Brave:', isBrave());
console.log('- User Agent:', navigator.userAgent);
console.log('\nExtension API checks:');
console.log('- chrome object exists:', typeof chrome !== 'undefined');
console.log('- chrome.runtime exists:', typeof chrome?.runtime !== 'undefined');
console.log('- chrome.tabs exists:', typeof chrome?.tabs !== 'undefined');
if (typeof chrome !== 'undefined' && chrome.runtime) {
  try {
    const manifest = chrome.runtime.getManifest();
    console.log('- Extension manifest:', manifest.name, 'v' + manifest.version);
  } catch (e) {
    console.log('- Extension manifest error:', e.message);
  }
} else {
  console.log('- Extension not detected');
}
console.log('\nContent script checks:');
console.log('- canvaHubTest function exists:', typeof window.canvaHubTest === 'function');
console.log('- canvaHubListenerRegistered:', window.canvaHubListenerRegistered);
if (typeof window.canvaHubTest === 'function') {
  try {
    const result = window.canvaHubTest();
    console.log('- Content script test result:', result);
  } catch (e) {
    console.log('- Content script test error:', e.message);
  }
} else {
  console.log('- Content script not loaded or test function missing');
}
console.log('\nCanva images on page:');
const allImages = document.querySelectorAll('img');
console.log('- Total images:', allImages.length);
const canvaImages = Array.from(allImages)
  .filter(img => {
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
    return src && (
      src.startsWith('https://media-public.canva.com') ||
      (src.includes('canva.com') && src.includes('media'))
    );
  });
console.log('- Canva images found:', canvaImages.length);
if (canvaImages.length > 0) {
  console.log('- Sample Canva image URLs:');
  canvaImages.slice(0, 3).forEach((img, i) => {
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
    console.log(`  ${i + 1}. ${src}`);
  });
}
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('\nTesting message passing...');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.log('- Tab query error:', chrome.runtime.lastError.message);
    } else {
      console.log('- Current tab:', tabs[0]?.url);
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'test' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('- Message test error:', chrome.runtime.lastError.message);
          } else {
            console.log('- Message test response:', response);
          }
        });
      }
    }
  });
}
console.log('\nBrave-specific checks:');
if (isBrave()) {
  console.log('- Brave Shields may be blocking the extension');
  console.log('- Try disabling Brave Shields for canva.com');
  console.log('- Check brave://settings/extensions for permissions');
} else {
  console.log('- Not running in Brave browser');
}
console.log('\nRecommendations:');
if (typeof window.canvaHubTest !== 'function') {
  console.log('🔴 Content script not loaded - try refreshing page');
}
if (canvaImages.length === 0) {
  console.log('🔴 No Canva images found - make sure you\'re on a Canva design page');
}
if (isBrave()) {
  console.log('🟡 Running in Brave - consider disabling Shields for canva.com');
}
console.log('=== End Diagnostic ===');