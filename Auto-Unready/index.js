async function sendKeys() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        console.log("[index.js] Loaded");
        
        function getAgentName(){
          const identityMenu = document.querySelector("#identity-menu");
          const ariaLabel = identityMenu?.getAttribute("aria-label") || "";
        
          const match = ariaLabel.match(/(AGENT|SUPERVISOR) \(([^)]+)\)/);
          let agentUsername = "";
          if (match && match[2]) {
            agentUsername = match[2].trim();
          }
          console.log("[index.js] Extracted agent username:", agentUsername);
          
          return agentUsername;
        }
        
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

        function setAgentStateToNotReady() {
          const agentUsername = getAgentName();
        
          const domain = window.location.hostname;
          const url = `https://${domain}:8445/finesse/api/User/${agentUsername}`;
          console.log("[index.js] API URL:", url);
          const xmlPayload = `<User><state>NOT_READY</state></User>`;
        
          fetch(url, {
            method: "PUT",
            credentials: "include",
            headers: {"Content-Type": "application/xml"},
            body: xmlPayload
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`[index.js] PUT failed: ${response.status} ${response.statusText}`);
              }
        
              return response.text();
            })
            .then(data => {
              console.log("[index.js] Finesse response:", data);

              console.log("[index.js] Next lines: about to show toast...");
              try {
                showToast(`${agentUsername} set to NOT_READY via direct API call!`);
              } catch(e) {
                console.error("[index.js] Error in showToast:", e);
              }

              console.log("[index.js] Toast shown. About to send setUnready...");
              chrome.runtime.sendMessage({ action: "setUnready" }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error("[index.js] Error sending setUnready:", chrome.runtime.lastError.message);
                } else {
                  console.log("[index.js] setUnready message sent successfully:", response);
                }
              });
            })
            .catch(err => {
              console.error("[index.js] Error setting agent state:", err);
              alert("Failed to set agent state. Check console for details.");
            });
        }
        
        setAgentStateToNotReady();
      }
    });
  }

document.getElementById("myButton").addEventListener("click", sendKeys);