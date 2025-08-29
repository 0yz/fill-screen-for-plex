// Track CSS injection state per tab
const tabStates = new Map();

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Send message to content script to check if this is a Plex page
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkPlex' });
    
    if (response && response.isPlex) {
      const currentState = tabStates.get(tab.id) || false;
      
      if (currentState) {
        // Remove CSS
        await chrome.scripting.removeCSS({
          target: { tabId: tab.id },
          files: ["style.css"]
        });
        tabStates.set(tab.id, false);
      } else {
        // Insert CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["style.css"]
        });
        tabStates.set(tab.id, true);
      }
    } else {
      // Not a Plex page
      console.log("This extension only works on Plex pages");
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: "Fill Screen for Plex",
        message: "This extension only works on Plex pages (app.plex.tv, localhost, etc.)"
      });
    }
  } catch (error) {
    console.error("Extension error:", error);
    // Fallback: try to inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content-script.js"]
      });
      // Retry the click operation after content script is injected
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { action: 'checkPlex' }).then(response => {
          if (response && response.isPlex) {
            chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ["style.css"]
            });
            tabStates.set(tab.id, true);
          }
        }).catch(retryError => console.error("Retry failed:", retryError));
      }, 100);
    } catch (injectionError) {
      console.error("Failed to inject content script:", injectionError);
    }
  }
});

// Clean up tab state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'plexDetected') {
    console.log(`Plex detected on: ${message.hostname}`);
  }
});
