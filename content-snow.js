function initScript() {
  console.log("[content-snow.js] Loaded");
  showToast("[Auto Unready] Loaded", 5000);

  // Recursively searches for an element matching a selector in nested shadow roots
  function findInNestedShadow(selector, root = document) {
    let results = Array.from(root.querySelectorAll(selector));

    const elements = root.querySelectorAll('*');
    for (const el of elements) {
      if (el.shadowRoot) {
        // Recursively search this shadow root and add any matches to results.
        const subResults = findAllInNestedShadow(selector, el.shadowRoot);
        results = results.concat(subResults);
      }
    }
    
    return results;
  }

  // Returns all elements matching the selector within nested open shadow roots
  function findAllInNestedShadow(selector, root = document) {
    let results = Array.from(root.querySelectorAll(selector));
    const elements = root.querySelectorAll('*');
    for (const el of elements) {
      if (el.shadowRoot) {
        results = results.concat(findAllInNestedShadow(selector, el.shadowRoot));
      }
    }

    return results;
  }

  // Returns the active screen element [<sn-canvas-screen> element that is visible]
  function getActiveScreen() {
    const allScreens = findAllInNestedShadow('sn-canvas-screen');
    const activeScreen = allScreens.find(screen => getComputedStyle(screen).display !== 'none');

    return activeScreen;
  }

  // Attempts to locate the Accept button within the active screen and logs every element searched
  function locateAcceptButton() {
    const activeScreen = getActiveScreen();
    if (!activeScreen) {
      console.log("[content-snow.js] No active screen found.");

      return;
    }

    const AcceptButtons = findInNestedShadow('button.now-button[aria-label="Accept"]', activeScreen.shadowRoot);
    const AcceptButton = AcceptButtons[0];

    if (AcceptButton){
      console.log("[content-snow.js] Found Accept button: ", AcceptButton);

      if (!AcceptButton.dataset.listenerAttached) {
        AcceptButton.dataset.listenerAttached = "true";
        AcceptButton.addEventListener("click", () => {
          console.log("[content-snow.js] Accept button pressed!");
          chrome.runtime.sendMessage({ action: "acceptClicked" });
        });
      }
    }
    else {
      console.log("[content-snow.js] Accept button not found in active screen. Retrying in 1 second.");
      setTimeout(locateAcceptButton, 1000);
    }
  }

  // Sets up a MutationObserver on the active screen to watch for changes and re-run the search
  function observeActiveScreen(screen) {
    locateAcceptButton();

    const observer = new MutationObserver((mutationsList) => {
      console.log("[content-snow.js] Detected mutations:", mutationsList);
      locateAcceptButton();
    });
    observer.observe(screen, { childList: true, subtree: true });

    return observer;
  }

  let currentActiveScreen = null;
  let currentObserver = null;

  // When a new active screen is detected, disconnect the previous observer and set up a new one
  setInterval(() => {
    const newActiveScreen = getActiveScreen();
    if (newActiveScreen && newActiveScreen !== currentActiveScreen) {
      console.log("[content-snow.js] Active screen changed:", newActiveScreen);
      if (currentObserver) {
        currentObserver.disconnect();
        currentObserver = null;
      }
      currentActiveScreen = newActiveScreen;
      currentObserver = observeActiveScreen(newActiveScreen);
      }
  }, 1000); 
}

if (document.readyState === "complete") {
  initScript();
} else {
  window.addEventListener("load", initScript);
}