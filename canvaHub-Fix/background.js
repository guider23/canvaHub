// background.js (service worker)

console.log('[CanvaHub] Background script loaded');

chrome.action.onClicked.addListener(async (tab) => {
  console.log('[CanvaHub] Extension icon clicked on tab:', tab.id);
  
  try {
    if (!tab.id) {
      throw new Error('No valid tab ID');
    }

    // Check if the tab URL is accessible
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('brave://')) {
      console.warn('[CanvaHub] Cannot access this type of page');
      return;
    }

    // Add timeout for message response
    const timeout = setTimeout(() => {
      console.error('[CanvaHub] Message timeout');
    }, 10000);

    chrome.tabs.sendMessage(
      tab.id,
      { action: 'getImages' },
      (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          console.error('[CanvaHub] Error communicating with content script:', chrome.runtime.lastError.message);
          // Try to inject content script if it's not loaded
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).then(() => {
            console.log('[CanvaHub] Content script injected, retrying...');
            // Retry after injection
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'getImages' }, (retryResponse) => {
                if (chrome.runtime.lastError) {
                  console.error('[CanvaHub] Retry failed:', chrome.runtime.lastError.message);
                  return;
                }
                handleImageResponse(retryResponse);
              });
            }, 500);
          }).catch(err => {
            console.error('[CanvaHub] Failed to inject content script:', err);
          });
          return;
        }

        handleImageResponse(response);
      }
    );

    function handleImageResponse(response) {
      if (response && response.error) {
        console.error('[CanvaHub] Content script error:', response.error);
        return;
      }

      const urls = (response && response.images) || [];
      console.log('[CanvaHub] Received images from content script:', urls);

      chrome.storage.local.set({ canvaImages: urls }, () => {
        if (chrome.runtime.lastError) {
          console.error('[CanvaHub] Error saving to storage:', chrome.runtime.lastError.message);
          return;
        }
        console.log('[CanvaHub] Images saved to storage');

        const page = chrome.runtime.getURL('extension.html');
        chrome.tabs.create({ url: page }, (newTab) => {
          if (chrome.runtime.lastError) {
            console.error('[CanvaHub] Error creating new tab:', chrome.runtime.lastError.message);
            return;
          }
          console.log('[CanvaHub] New tab created:', newTab.id);
        });
      });
    }
  } catch (error) {
    console.error('[CanvaHub] Error in background script:', error);
  }
});

// Check if this is Brave browser and log helpful info
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[CanvaHub] Extension installed/updated:', details.reason);
  
  // Check if Brave
  chrome.tabs.query({}, (tabs) => {
    if (tabs.length > 0) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          const isBrave = (navigator.brave && navigator.brave.isBrave) || /Brave/.test(navigator.userAgent);
          console.log('[CanvaHub] Browser detected:', isBrave ? 'Brave' : 'Other');
          if (isBrave) {
            console.log('[CanvaHub] Brave detected - remember to disable Shields for canva.com if needed');
          }
        }
      }).catch(() => {
        // Ignore errors for restricted pages
      });
    }
  });
});
