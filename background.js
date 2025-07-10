console.log("[background.js] Service worker is running...");

let snowTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "acceptClicked") {
    console.log("[background.js] Accept button was clicked in SNOW! Now pressing Unready in Finesse...");
    
    snowTabId = sender.tab.id;
    console.log("[background.js] Snow tab ID:", snowTabId);

    chrome.tabs.query({ url: "*://*.nna.net/*" }, (tabs) => {
      if (tabs.length === 0) {
        console.warn("[background.js] No Finesse tab found");

        return;
      }

      const finesseTabId = tabs[0].id;
      console.log("[background.js] Found Finesse tab:", finesseTabId);
      
      chrome.tabs.update(finesseTabId, { active: true });
      chrome.tabs.get(finesseTabId, (tab) => {
        if (tab && tab.windowId !== undefined) {
          chrome.windows.update(tab.windowId, { focused: true });
        }
      });

      chrome.tabs.sendMessage(finesseTabId, {action: "pressUnready", id: finesseTabId});
    });
  }

  if (message.action === "setUnready") {
    console.log("[background.js] Set Unready message received, focusing SNOW window")
    console.log("[background.js] Found Snow tab:", snowTabId);

    if(snowTabId) {
      chrome.tabs.update(snowTabId, { active: true });
      chrome.tabs.get(snowTabId, (tab) => {
        if (tab && tab.windowId != null) {
          chrome.windows.update(tab.windowId, { focused: true });
        }
      });
    }
  }
});