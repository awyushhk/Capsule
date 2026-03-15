import { CONFIG } from '../utils/config';

// ─── Installation ─────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Capsule] Extension installed. Welcome!');
    chrome.storage.local.set({ "capsule-enabled": true });
  } else if (details.reason === 'update') {
    console.log(`[Capsule] Updated to version ${chrome.runtime.getManifest().version}`);
  }
});

// ─── Action Click ─────────────────────────────────────────────────────────────

/**
 * Handle clicks on the pinned extension icon in the browser toolbar.
 * (Deprecated: Now handled by popup/index.html)
 */
// chrome.action.onClicked.addListener(() => {
//   chrome.tabs.create({ url: CONFIG.DASHBOARD_URL });
// });

// ─── Message Routing ──────────────────────────────────────────────────────────

/**
 * Handle messages from content scripts or the sidebar.
 * Currently minimal — storage is accessed directly from the sidebar page.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_VERSION') {
    sendResponse({ version: chrome.runtime.getManifest().version });
    return true;
  }

  if (message.type === 'OPEN_SIDEBAR') {
    // Inject the content script if needed (handled by declarativeContent or content_scripts)
    console.log('[Capsule BG] Open sidebar requested from tab:', sender.tab?.id);
    return true;
  }
});

// ─── Startup ──────────────────────────────────────────────────────────────────

chrome.runtime.onStartup.addListener(() => {
  console.log('[Capsule] Browser started.');
});

export {};
