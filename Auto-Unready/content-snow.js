function initScript() {
  console.log("[content-snow.js] Loaded");
  showToast("[Auto Unready] Loaded", 5000);
  
  function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '10px 20px';
    toast.style.backgroundColor = '#333';
    toast.style.color = '#fff';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '14px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
  
    document.body.appendChild(toast);
  
    // Trigger reflow to apply the initial styles
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });
  
    // Remove after `duration` ms
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300); // Wait for fade-out transition
    }, duration);
  }

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

  // Attempts to locate the Save button within the active screen and logs every element searched
  function locateSaveButton() {
    const activeScreen = getActiveScreen();
    if (!activeScreen) {
      console.log("[content-snow.js] No active screen found.");

      return;
    }

    const saveButtons = findInNestedShadow('button.now-button[aria-label="Accept"]', activeScreen.shadowRoot);
    const saveButton = saveButtons[0];

    if (saveButton){
      console.log("[content-snow.js] Found Save button: ", saveButton);

      if (!saveButton.dataset.listenerAttached) {
        saveButton.dataset.listenerAttached = "true";
        saveButton.addEventListener("click", () => {
          console.log("[content-snow.js] Accept button pressed!");
          chrome.runtime.sendMessage({ action: "acceptClicked" });
        });
      }
    }
    else {
      console.log("[content-snow.js] Accept button not found in active screen. Retrying in 1 second.");
      setTimeout(locateSaveButton, 1000);
    }
  }

  // Sets up a MutationObserver on the active screen to watch for changes and re-run the search
  function observeActiveScreen(screen) {
    locateSaveButton();

    const observer = new MutationObserver((mutationsList) => {
      console.log("[content-snow.js] Detected mutations:", mutationsList);
      locateSaveButton();
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