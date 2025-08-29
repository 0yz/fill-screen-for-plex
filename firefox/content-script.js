// Content script to detect Plex and communicate with background script
(function() {
  'use strict';
  
  // Check if this is a Plex page by looking for Plex-specific elements and URLs
  function isPlexPage() {
    // Check URL patterns for various Plex installations
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
  
  // Send detection result to background script
  if (isPlexPage()) {
    browser.runtime.sendMessage({
      action: 'plexDetected',
      url: window.location.href,
      hostname: window.location.hostname
    });
  }
  
  // Listen for messages from background script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkPlex') {
      sendResponse({ isPlex: isPlexPage() });
    }
  });
})();
