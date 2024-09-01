let isCSSInjected = false;

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.location.hostname.includes('app.plex.tv')
  }, (results) => {
    if (results && results[0].result) {
      if (isCSSInjected) {
        chrome.scripting.removeCSS({
          target: { tabId: tab.id },
          files: ["style.css"]
        });
        isCSSInjected = false;
      } else {
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["style.css"]
        });
        isCSSInjected = true;
      }
    } else {
      alert("This extension only works on app.plex.tv");
    }
  });
});
