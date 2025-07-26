# Brave Browser Troubleshooting Guide

If the Canva Hub extension is not working in Brave but works in other browsers, follow these steps:

## 1. Disable Brave Shields for Canva
1. Go to any Canva page (canva.com)
2. Click the **Brave Shields** icon (lion/shield) in the address bar
3. Toggle **Shields** to **Down** for canva.com
4. Refresh the page and try the extension again

## 2. Check Extension Permissions
1. Go to `brave://extensions/`
2. Find "bC Works Canva Hub"
3. Click **Details**
4. Make sure these are enabled:
   - **Allow in incognito** (if using incognito)
   - **Allow access to file URLs** (if needed)
   - **Site access**: Set to "On specific sites" and add `canva.com`

## 3. Reset Extension Settings
1. Go to `brave://extensions/`
2. Find the extension and click **Remove**
3. Reinstall the extension
4. Grant all requested permissions

## 4. Clear Browser Data
1. Go to `brave://settings/clearBrowserData`
2. Select **All time**
3. Check:
   - Cached images and files
   - Cookies and other site data
4. Click **Clear data**
5. Restart Brave and try again

## 5. Disable Other Extensions
Temporarily disable other extensions that might interfere:
1. Go to `brave://extensions/`
2. Disable all other extensions
3. Test if Canva Hub works
4. Re-enable extensions one by one to find conflicts

## 6. Check Brave Version
Make sure you're using a recent version of Brave:
1. Go to `brave://settings/help`
2. Update if needed
3. Restart Brave

## 7. Manual Testing
Open Brave Developer Tools on a Canva page:
1. Press F12
2. Go to Console tab
3. Type: `chrome.runtime.getManifest()`
4. If you see extension info, the extension is loaded
5. Type: `window.canvaHubTest()` 
6. If you get an error, the content script isn't working

## 8. Alternative: Use Brave's Chrome Web Store
If the extension was loaded from a local file:
1. Upload the extension to Chrome Web Store (if possible)
2. Install from the official store
3. Brave has better compatibility with store extensions

## 9. Check Console Errors
Look for specific error messages:
- "Content Security Policy" errors
- "Failed to inject content script" 
- "Brave Shields blocked"

## 10. Last Resort: Extension Flags
If nothing works, try enabling extension compatibility:
1. Go to `brave://flags/`
2. Search for "extension"
3. Enable any relevant compatibility flags
4. Restart Brave

## Common Brave-Specific Issues:
- **Shields blocking scripts**: Disable shields for canva.com
- **Fingerprinting protection**: May block content script injection
- **Ad blocking**: Can interfere with extension communication
- **Strict site isolation**: May prevent cross-frame communication

If none of these steps work, try using the extension in Chrome or Edge as alternatives.