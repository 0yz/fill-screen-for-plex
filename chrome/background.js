// Track CSS injection state per tab
const tabStates = new Map();

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Inject content script to check if this is a Plex page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Check if this is a Plex page by looking for Plex-specific elements and URLs
        const hostname = window.location.hostname.toLowerCase();
        const pathname = window.location.pathname;
        
        // Official Plex URLs
        if (hostname.includes('plex.tv') || hostname.includes('plex.direct')) {
          return true;
        }
        
        // Local Plex installations (localhost, 127.0.0.1, local IPs)
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.match(/^192\.168\.\d+\.\d+$/) ||
            hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
            hostname.match(/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/)) {
          
          // Check for Plex-specific indicators
          const plexIndicators = [
            // Check for Plex in title
            document.title.toLowerCase().includes('plex'),
            // Check for Plex-specific meta tags
            !!document.querySelector('meta[name="apple-mobile-web-app-title"][content*="Plex"]'),
            // Check for Plex-specific elements
            !!document.querySelector('[class*="plex"], [id*="plex"]'),
            // Check for Plex web client specific elements
            !!document.querySelector('div[class*="application"], div[class*="App"]') && 
              document.body.innerHTML.includes('web-client'),
            // Check URL path for Plex patterns
            pathname.includes('/web/') || pathname === '/' || pathname.includes('/desktop')
          ];
          
          return plexIndicators.some(indicator => indicator);
        }
        
        return false;
      }
    });
    
    const isPlex = results && results[0] && results[0].result;
    
    if (isPlex) {
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
      // Not a Plex page - just log it, no notifications needed
      console.log("This extension only works on Plex pages (app.plex.tv, localhost, local IPs, etc.)");
    }
  } catch (error) {
    console.error("Extension error:", error);
  }
});

// Clean up tab state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});
