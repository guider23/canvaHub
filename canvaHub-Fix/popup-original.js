document.addEventListener('DOMContentLoaded', function() {
  console.log('[CanvaHub] Popup DOM loaded');
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
  const observer = new MutationObserver(() => {
    const currentImages = Array.from(document.querySelectorAll('img'))
      .filter(img => img.src.startsWith('https://media-public.canva.com'));
    updateButtonText(currentImages.length);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  async function sendGetImages(tabId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Content script timeout - try disabling Brave Shields'));
      }, 15000);
      chrome.tabs.sendMessage(tabId, { action: 'getImages' }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
  const extractBtn = document.getElementById('extract');
  if (extractBtn) {
    extractBtn.addEventListener('click', async () => {
      console.log('[CanvaHub] Extract Images button clicked');
      let button = document.getElementById('extract');
      let status = document.getElementById('status');
      if (!button || !status) {
        console.error('[CanvaHub] Button or status element missing');
        return;
      }
      button.classList.add('loading');
      button.querySelector('.button-text').textContent = 'Extracting...';
      status.textContent = '';
      status.className = 'status';
      try {
        try {
          console.log('[CanvaHub] Querying active tab...');
          let tab;
          try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            tab = tabs[0];
            console.log('[CanvaHub] Tab query result:', tab);
            if (!tab) {
              throw new Error('No active tab found');
            }
            if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('brave://')) {
              throw new Error('Cannot access this type of page');
            }
          } catch (tabQueryError) {
            console.error('[CanvaHub] Error querying tabs:', tabQueryError);
              status.textContent = 'Error: Unable to get active tab. (Are you on a restricted page?)';
              status.className = 'status error';
              button.classList.remove('loading');
              updateButtonText(0);
              return;
            }
            if (!tab.url.includes('canva.com')) {
              status.textContent = 'Please open a Canva page first';
              status.className = 'status error';
              button.classList.remove('loading');
              updateButtonText(0);
              console.log('[CanvaHub] Not a Canva page:', tab && tab.url);
              return;
            }
          let response;
          try {
            console.log('[CanvaHub] Sending getImages message to content script...');
            response = await sendGetImages(tab.id);
            console.log('[CanvaHub] Received response from content script:', response);
          } catch (err) {
            console.warn('[CanvaHub] Content script not found, injecting...', err);
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: false },
                files: ['content.js'],
                injectImmediately: false
              });
              await new Promise(resolve => setTimeout(resolve, 1000));
              response = await sendGetImages(tab.id);
              console.log('[CanvaHub] Received response after injection:', response);
            } catch (injectionError) {
              console.error('[CanvaHub] Failed to inject content script:', injectionError);
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: () => {
                    console.log('[CanvaHub] Inline injection successful');
                    window.canvaHubInjected = true;
                  }
                });
                await new Promise(resolve => setTimeout(resolve, 200));
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['content.js']
                });
                await new Promise(resolve => setTimeout(resolve, 800));
                response = await sendGetImages(tab.id);
              } catch (finalError) {
                throw new Error('Failed to inject content script. Please disable Brave Shields and refresh the page.');
              }
            }
          }
          if (response.error) throw new Error(response.error);
          const urls = response.images || [];
          console.log('[CanvaHub] URLs found:', urls);
          if (urls.length === 0) {
            status.textContent = 'No Canva images found. Try refreshing the page.';
            status.className = 'status error';
            button.classList.remove('loading');
            updateButtonText(0);
            return;
          }
          await chrome.storage.local.set({ canvaImages: urls });
          const page = chrome.runtime.getURL('extension.html');
          await chrome.tabs.create({ url: page });
          status.textContent = `Found ${urls.length} image${urls.length === 1 ? '' : 's'}`;
          status.className = 'status success';
          button.classList.remove('loading');
          updateButtonText(urls.length);
        } catch (error) {
          console.error('[CanvaHub] Error:', error);
          let errorMessage = error && error.message ? error.message : String(error);
          if (errorMessage.includes('Cannot access')) {
            errorMessage = 'Cannot access this page. Please try on a Canva.com design page.';
          } else if (errorMessage.includes('Content script timeout')) {
            errorMessage = 'Extension timed out. Please refresh the page and try again.';
          } else if (errorMessage.includes('Content script not loaded') || errorMessage.includes('No response from content script')) {
            errorMessage = 'Please refresh the Canva page and try again';
          } else if (errorMessage.includes('Failed to inject')) {
            errorMessage = 'Unable to load extension on this page. Try refreshing or check browser permissions.';
          }
          status.textContent = errorMessage;
          status.className = 'status error';
          button.classList.remove('loading');
          updateButtonText(0);
        }
      } catch (fatalError) {
        console.error('[CanvaHub] Fatal error:', fatalError);
        if (status) {
          status.textContent = 'Unexpected error: ' + (fatalError && fatalError.message ? fatalError.message : String(fatalError));
          status.className = 'status error';
        }
        if (button) button.classList.remove('loading');
      }
    });
  } else {
    console.error('[CanvaHub] Extract button not found in DOM');
  }
  window.debugCanvaHub = async function() {
    console.log('[CanvaHub Debug] Starting debug test...');
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      console.log('[CanvaHub Debug] Current tab:', tab);
      if (!tab) {
        console.error('[CanvaHub Debug] No active tab');
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: 'test' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[CanvaHub Debug] Message error:', chrome.runtime.lastError);
        } else {
          console.log('[CanvaHub Debug] Message response:', response);
        }
      });
    } catch (error) {
      console.error('[CanvaHub Debug] Debug error:', error);
    }
  };
  function getBrowserInfo() {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isBrave = (navigator.brave && navigator.brave.isBrave) || false;
    const isEdge = /Edg/.test(navigator.userAgent);
    let browser = 'Unknown';
    if (isBrave) browser = 'Brave';
    else if (isEdge) browser = 'Edge';
    else if (isChrome) browser = 'Chrome';
    return {
      browser,
      userAgent: navigator.userAgent,
      manifestVersion: chrome.runtime.getManifest().version
    };
  }
  console.log('[CanvaHub] Browser info:', getBrowserInfo());
});