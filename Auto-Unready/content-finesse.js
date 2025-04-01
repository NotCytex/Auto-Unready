console.log("[content-finesse.js] Loaded");
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

function getAgentName() {
  const identityMenu = document.querySelector("#identity-menu");
  const ariaLabel = identityMenu?.getAttribute("aria-label") || "";

  const match = ariaLabel.match(/(AGENT|SUPERVISOR) \(([^)]+)\)/);
  let agentUsername = "";
  if (match && match[2]) {
    agentUsername = match[2].trim();
  }
  console.log("[content-finesse.js] Extracted agent username:", agentUsername);
  
  return agentUsername;
}

function ensureAgentName(maxRetries = 10, intervalMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const intervalId = setInterval(() => {
      attempts++;
      const agentUsername = getAgentName();
      if (agentUsername) {
        clearInterval(intervalId);
        resolve(agentUsername);
      } else if (attempts >= maxRetries) {
        clearInterval(intervalId);
        reject(new Error("Unable to find agent username after 10 attempts."));
      }
    }, intervalMs);
  });
}

function setAgentStateToNotReady() {
  ensureAgentName()
    .then((agentUsername) => {
      console.log("[content-finesse.js] Found agent username:", agentUsername);

      const domain = window.location.hostname;
      console.log("[content-finesse.js] Domain:", domain);
      const url = `https://${domain}:8445/finesse/api/User/${agentUsername}`;

      console.log("[content-finesse.js] API URL:", url);
      const xmlPayload = `<User><state>NOT_READY</state></User>`;

      return fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/xml"
        },
        body: xmlPayload
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`[content-finesse.js] PUT failed: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((data) => {
        console.log("[content-finesse.js] Finesse response:", data);
        showToast(`${agentUsername} set to NOT_READY via direct API call!`);

        chrome.runtime.sendMessage({ action: "setUnready" }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("[index.js] Error sending setUnready:", chrome.runtime.lastError.message);
          } else {
            console.log("[index.js] setUnready message sent successfully:", response);
          }
        });
      });
    })
    .catch((err) => {
      console.error("[content-finesse.js] Error setting agent state:", err);
      alert("Failed to set agent state. Check console for details.");
    });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "pressUnready") {
    //console.log("[content-finesse.js] Tab ID: ", message.id);
    console.log("[content-finesse.js] Received pressUnready message");
    
    //alert("Blob: Unready!!!");
    setAgentStateToNotReady();
  }
});