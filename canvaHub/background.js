// background.js (service worker)

console.log('Background script loaded');

chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
  
  try {
    if (!tab.id) {
      throw new Error('No valid tab ID');
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: 'getImages' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with content script:', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.error) {
          console.error('Content script error:', response.error);
          return;
        }

        const urls = (response && response.images) || [];
        console.log('Received images from content script:', urls);

        chrome.storage.local.set({ canvaImages: urls }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving to storage:', chrome.runtime.lastError.message);
            return;
          }
          console.log('Images saved to storage');

          const page = chrome.runtime.getURL('extension.html');
          chrome.tabs.create({ url: page }, (newTab) => {
            if (chrome.runtime.lastError) {
              console.error('Error creating new tab:', chrome.runtime.lastError.message);
              return;
            }
            console.log('New tab created:', newTab.id);
          });
        });
      }
    );
  } catch (error) {
    console.error('Error in background script:', error);
  }
});
