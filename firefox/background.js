let isCSSInjected = false;

chrome.browserAction.onClicked.addListener((tab) => {
  if (tab.url.includes("app.plex.tv")) {
    if (isCSSInjected) {
      chrome.tabs.removeCSS(tab.id, { file: "style.css" });
      isCSSInjected = false;
    } else {
      chrome.tabs.insertCSS(tab.id, { file: "style.css" });
      isCSSInjected = true;
    }
  } else {
    alert("This extension only works on app.plex.tv");
  }
});
