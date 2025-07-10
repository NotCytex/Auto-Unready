## Purpose

Chrome extension to automatically put you on "Unready" state when doing a walk-up.
    
## Loading the extension

    Clone or download the repository.

    Open Chrome and navigate to chrome://extensions.

    Enable Developer mode and click Load unpacked.

    Select the Auto-Unready folder (the one containing manifest.json).
    
## Testing functionality

* Load the extension as described above.
* Open ServiceNow (https://fairfaxmedia.service-now.com) and Cisco Finesse (https://*.nna.net).
* Accept a walk-up in ServiceNow. The extension should automatically switch focus to Finesse and set your agent state to “NOT_READY”, confirmed by a toast notification or Finesse’s own status indicator.
* Alternatively, open the extension popup and click the button to manually send the state change.
