console.log('[CanvaHub] Popup script loaded');
document.addEventListener('DOMContentLoaded', function() {
  console.log('[CanvaHub] DOM loaded');
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
  const statusDiv = document.getElementById('status');
  if (!extractBtn) {
    console.error('[CanvaHub] Extract button not found!');
    return;
  }
  if (!statusDiv) {
    console.error('[CanvaHub] Status div not found!');
    return;
  }
  console.log('[CanvaHub] Button and status elements found');
  extractBtn.addEventListener('click', async function() {
    console.log('[CanvaHub] Button clicked!');
    extractBtn.classList.add('loading');
    extractBtn.querySelector('.button-text').textContent = 'Extracting...';
    statusDiv.textContent = '';
    statusDiv.className = 'status';
    try {
      console.log('[CanvaHub] Getting current tab...');
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        throw new Error('No active tab found');
      }
      const tab = tabs[0];
      console.log('[CanvaHub] Current tab:', tab.url);
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('brave://')) {
        throw new Error('Cannot access this type of page');
      }
      if (!tab.url || !tab.url.includes('canva.com')) {
        throw new Error('Please open a Canva design page');
      }
      console.log('[CanvaHub] Sending message to content script...');
      let response;
      try {
        response = await sendGetImages(tab.id);
        console.log('[CanvaHub] Response received:', response);
      } catch (err) {
        console.warn('[CanvaHub] Content script not found, injecting...', err);
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
          response = await sendGetImages(tab.id);
          console.log('[CanvaHub] Response after injection:', response);
        } catch (injectionError) {
          console.error('[CanvaHub] Failed to inject content script:', injectionError);
          throw new Error('Failed to inject content script. Please disable Brave Shields and refresh the page.');
        }
      }
      if (!response) {
        throw new Error('No response from content script');
      }
      if (response.error) {
        throw new Error(response.error);
      }
      const images = response.images || [];
      console.log('[CanvaHub] Images found:', images.length);
      if (images.length === 0) {
        statusDiv.textContent = 'No Canva images found on this page';
        statusDiv.className = 'status error';
        updateButtonText(0);
      } else {
        statusDiv.textContent = `Found ${images.length} image(s) - Opening in new tab...`;
        statusDiv.className = 'status success';
        updateButtonText(images.length);
        await chrome.storage.local.set({ canvaImages: images });
        const extensionPage = chrome.runtime.getURL('extension.html');
        await chrome.tabs.create({ url: extensionPage });
      }
    } catch (error) {
      console.error('[CanvaHub] Error:', error);
      let errorMessage = error && error.message ? error.message : String(error);
      if (errorMessage.includes('Cannot access')) {
        errorMessage = 'Cannot access this page. Please try on a Canva.com design page.';
      } else if (errorMessage.includes('Content script timeout')) {
        errorMessage = 'Extension timed out. Please refresh the page and try again.';
      } else if (errorMessage.includes('Failed to inject')) {
        errorMessage = 'Unable to load extension on this page. Try refreshing or check browser permissions.';
      }
      statusDiv.textContent = `Error: ${errorMessage}`;
      statusDiv.className = 'status error';
      updateButtonText(0);
    } finally {
      extractBtn.classList.remove('loading');
    }
  });
  console.log('[CanvaHub] Event listener attached');
});