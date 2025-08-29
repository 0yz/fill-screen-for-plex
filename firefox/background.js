// Track CSS injection state per tab
const tabStates = new Map();

// Handle extension icon clicks
browser.browserAction.onClicked.addListener(async (tab) => {
  try {
    // Send message to content script to check if this is a Plex page
    const response = await browser.tabs.sendMessage(tab.id, { action: 'checkPlex' });
    
    if (response && response.isPlex) {
      const currentState = tabStates.get(tab.id) || false;
      
      if (currentState) {
        // Remove CSS
        await browser.tabs.removeCSS(tab.id, { file: "style.css" });
        tabStates.set(tab.id, false);
      } else {
        // Insert CSS
        await browser.tabs.insertCSS(tab.id, { file: "style.css" });
        tabStates.set(tab.id, true);
      }
    } else {
      // Not a Plex page
      console.log("This extension only works on Plex pages");
      browser.notifications.create({
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
      await browser.tabs.executeScript(tab.id, { file: "content-script.js" });
      // Retry the click operation after content script is injected
      setTimeout(async () => {
        try {
          const response = await browser.tabs.sendMessage(tab.id, { action: 'checkPlex' });
          if (response && response.isPlex) {
            await browser.tabs.insertCSS(tab.id, { file: "style.css" });
            tabStates.set(tab.id, true);
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }, 100);
    } catch (injectionError) {
      console.error("Failed to inject content script:", injectionError);
    }
  }
});

// Clean up tab state when tab is closed
browser.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Handle messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'plexDetected') {
    console.log(`Plex detected on: ${message.hostname}`);
  }
});
