# Canva Hub Extension - Debugging Guide

## Common Issues and Solutions

### Extension works in one browser but not others

If the extension works in Ghost Browser but not in Chrome/Brave, try these debugging steps:

## 1. Check Browser Console
1. Open the Canva page where you want to extract images
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Look for any error messages starting with `[CanvaHub]`

## 2. Test Content Script Loading
1. On a Canva page, open the console (F12 → Console)
2. Type: `window.canvaHubTest()` and press Enter
3. You should see a response like `{status: 'working', timestamp: ...}`
4. If you get an error, the content script isn't loaded properly

## 3. Test Extension Popup
1. Click the extension icon to open the popup
2. Right-click on the popup and select "Inspect"
3. In the popup's console, type: `debugCanvaHub()` and press Enter
4. Check for any error messages

## 4. Manual Content Script Injection
If the automatic injection fails, you can manually inject it:
1. Open Developer Tools on the Canva page
2. Go to Sources tab → Content Scripts
3. Look for "content.js" - if it's missing, the script didn't load

## 5. Common Fixes

### Fix 1: Reload Extension
1. Go to `chrome://extensions/` (or `brave://extensions/`)
2. Find "bC Works Canva Hub"
3. Click the reload button (🔄)
4. Try again

### Fix 2: Check Permissions
1. Go to extension settings
2. Make sure "Allow access to file URLs" is enabled (if needed)
3. Make sure site access is set to "On all sites"

### Fix 3: Clear Extension Storage
1. Go to `chrome://extensions/`
2. Click "Details" on the Canva Hub extension
3. Scroll down and click "Extension options" (if available)
4. Or manually clear by going to Developer Tools → Application → Storage

### Fix 4: Browser-Specific Issues
- **Chrome**: Make sure you're not in Incognito mode without permission
- **Brave**: Disable Brave Shields on the Canva page
- **Edge**: Check if tracking prevention is blocking the extension

## 6. Error Messages and Solutions

| Error Message | Solution |
|---------------|----------|
| "Content script timeout" | Refresh the page and try again |
| "Cannot access this type of page" | Make sure you're on a Canva.com page |
| "No active tab found" | Close and reopen the extension popup |
| "Failed to inject content script" | Check if the page allows extensions to run |

## 7. Testing Steps
1. Go to any Canva design page
2. Make sure images are visible on the page
3. Click the extension icon
4. Click "Extract Images"
5. A new tab should open with the extracted images

If you're still having issues, check the browser console for detailed error messages.
