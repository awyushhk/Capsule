/**
 * Capsule Content Script — inject.ts
 *
 * Responsibilities:
 * 1. Inject the Capsule sidebar iframe into the YouTube page
 * 2. Inject the Capsule button near the Like/Dislike buttons
 * 3. Handle YouTube SPA navigation (yt-navigate-finish)
 * 4. Relay messages between YouTube page and the sidebar iframe
 */

import { getCurrentVideoInfo, isVideoPage } from "../utils/youtubeParser";
import type {
  CurrentVideoInfo,
  ContentToSidebarMessage,
  SidebarToContentMessage,
} from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR_IFRAME_ID = "capsule-sidebar-iframe";
const CAPSULE_BTN_ID = "capsule-open-btn";
const SIDEBAR_WIDTH = 340; // px

// ─── State ────────────────────────────────────────────────────────────────────

let isSidebarOpen = false;
let isCollapsedStrip = false;
let sidebarIframe: HTMLIFrameElement | null = null;
let buttonInjectionAttempts = 0;
const MAX_ATTEMPTS = 20;

// ─── Sidebar Iframe ───────────────────────────────────────────────────────────

function createSidebarIframe(): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.id = SIDEBAR_IFRAME_ID;
  iframe.src = chrome.runtime.getURL("sidebar/index.html");
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("frameborder", "0");
  document.body.appendChild(iframe);
  return iframe;
}

function getSidebarIframe(): HTMLIFrameElement {
  const existing = document.getElementById(
    SIDEBAR_IFRAME_ID,
  ) as HTMLIFrameElement | null;
  if (existing) return existing;
  sidebarIframe = createSidebarIframe();
  return sidebarIframe;
}

// ─── Sidebar Toggle ───────────────────────────────────────────────────────────

function openSidebar() {
  const iframe = getSidebarIframe();
  isSidebarOpen = true;
  iframe.classList.add("capsule-open");
  iframe.classList.remove("capsule-closed");

  // Push YouTube content left so nothing is hidden under the sidebar
  adjustYouTubeLayout(SIDEBAR_WIDTH);

  // Send current video info to the sidebar every time it's opened/focused
  const videoInfo = getCurrentVideoInfo();
  if (videoInfo) {
    sendToSidebar({ type: "CURRENT_VIDEO", video: videoInfo });
    sendToSidebar({ type: "OPEN_SAVE_PANEL" });
  }

  // Persist open state across navigations
  chrome.storage.local.set({ "capsule-sidebar-open": true });
}

function closeSidebar() {
  const iframe = document.getElementById(
    SIDEBAR_IFRAME_ID,
  ) as HTMLIFrameElement | null;
  if (!iframe) return;

  isSidebarOpen = false;
  iframe.classList.remove("capsule-open");
  iframe.classList.add("capsule-closed");
  adjustYouTubeLayout(0);

  chrome.storage.local.set({ "capsule-sidebar-open": false });
}

function toggleSidebar() {
  if (isSidebarOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// ─── Layout Adjustment ────────────────────────────────────────────────────────

function adjustYouTubeLayout(width: number) {
  const masthead = document.getElementById("masthead-container");
  const page = document.querySelector<HTMLElement>(
    "ytd-watch-flexy, ytd-browse",
  );
  const iframe = document.getElementById(
    SIDEBAR_IFRAME_ID,
  ) as HTMLIFrameElement | null;

  const w = width > 0 ? `${width}px` : "";
  if (masthead) masthead.style.paddingRight = w;
  if (page) page.style.marginRight = w;

  // Resize the iframe itself so it matches the actual sidebar width
  if (iframe) {
    if (width > 0 && width <= 40) {
      iframe.classList.add("capsule-collapsed");
    } else {
      iframe.classList.remove("capsule-collapsed");
    }
  }
}

// ─── Capsule Button ───────────────────────────────────────────────────────────

function buildCapsuleButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.id = CAPSULE_BTN_ID;
  btn.title = "Capsule — Save this video";
  btn.innerHTML = `
  <div style="
    width:28px; height:28px;
    background:#FF2D2D;
    border-radius:7px;
    display:flex; align-items:center; justify-content:center;
    box-shadow: 0 2px 8px rgba(255,45,45,0.4);
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3h14a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>
    </svg>
  </div>`;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isCollapsedStrip) {
      // Sidebar is in strip mode — tell React to expand it
      sendToSidebar({ type: "EXPAND_SIDEBAR" });
      adjustYouTubeLayout(SIDEBAR_WIDTH);
      isCollapsedStrip = false;
      
      // Update with current video
      const videoInfo = getCurrentVideoInfo();
      if (videoInfo) {
        sendToSidebar({ type: "CURRENT_VIDEO", video: videoInfo });
        sendToSidebar({ type: "OPEN_SAVE_PANEL" });
      }
    } else if (isSidebarOpen) {
      // If already open, just update the context back to the current playing video
      const videoInfo = getCurrentVideoInfo();
      if (videoInfo) {
        sendToSidebar({ type: "CURRENT_VIDEO", video: videoInfo });
        sendToSidebar({ type: "OPEN_SAVE_PANEL" });
      }
    } else {
      openSidebar();
    }
  });
  return btn;
}

/**
 * Try to inject the Capsule button near YouTube's action buttons.
 * YouTube's DOM loads asynchronously, so we retry with exponential backoff.
 */
function injectCapsuleButton() {
  // Don't inject on non-video pages
  if (!isVideoPage()) return;

  // Don't inject if already present
  if (document.getElementById(CAPSULE_BTN_ID)) return;

  buttonInjectionAttempts++;
  if (buttonInjectionAttempts > MAX_ATTEMPTS) return;

  // These selectors target the action buttons area (like/dislike/share)
  // YouTube changes their DOM periodically; we try multiple selectors
  const target =
    document.querySelector<HTMLElement>("ytd-watch-metadata #actions") ||
    document.querySelector<HTMLElement>("#actions.ytd-watch-metadata") ||
    document
      .querySelector<HTMLElement>(
        "ytd-video-primary-info-renderer #top-level-buttons-computed",
      )
      ?.closest("#menu") ||
    document.querySelector<HTMLElement>("#above-the-fold #actions");

  if (!target) {
    // Retry after a short delay
    setTimeout(injectCapsuleButton, 500);
    return;
  }

  const btn = buildCapsuleButton();
  target.appendChild(btn);
  buttonInjectionAttempts = 0;
  console.log("[Capsule] Button injected ✓");
}

// ─── Message Passing ──────────────────────────────────────────────────────────

function sendToSidebar(message: ContentToSidebarMessage) {
  const iframe = document.getElementById(
    SIDEBAR_IFRAME_ID,
  ) as HTMLIFrameElement | null;
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    { source: "capsule-content", ...message },
    "*",
  );
}

/** Listen for messages FROM the sidebar iframe */
window.addEventListener("message", (event: MessageEvent) => {
  // Only handle messages from our extension
  if (event.data?.source !== "capsule-sidebar") return;

  const message = event.data as SidebarToContentMessage & { source: string };

  switch (message.type) {
    case "NAVIGATE_TO": {
      // Navigate the YouTube page using an anchor click (triggers SPA routing)
      const a = document.createElement("a");
      a.href = message.url;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      break;
    }

    case "SIDEBAR_READY": {
      // Sidebar loaded — send current video info and state
      const videoInfo = getCurrentVideoInfo();
      if (videoInfo) {
        sendToSidebar({ type: "CURRENT_VIDEO", video: videoInfo });
      }
      sendToSidebar({ type: "SET_COLLAPSED", collapsed: isCollapsedStrip });
      break;
    }

    case "GET_CURRENT_VIDEO": {
      const videoInfo = getCurrentVideoInfo();
      if (videoInfo) {
        sendToSidebar({ type: "CURRENT_VIDEO", video: videoInfo });
      }
      break;
    }

    case "SIDEBAR_RESIZE": {
      adjustYouTubeLayout(message.width);
      // Track whether sidebar is in collapsed strip mode
      const collapsed = message.width > 0 && message.width < SIDEBAR_WIDTH;
      if (collapsed !== isCollapsedStrip) {
        isCollapsedStrip = collapsed;
        chrome.storage.local.set({ "capsule-collapsed-strip": isCollapsedStrip });
      }
      break;
    }
  }
});

// ─── YouTube SPA Navigation ───────────────────────────────────────────────────

/**
 * YouTube is a SPA — we must re-inject our button on every navigation.
 * The 'yt-navigate-finish' event fires after YouTube updates the DOM.
 */
function onYouTubeNavigate() {
  buttonInjectionAttempts = 0;
  document.getElementById(CAPSULE_BTN_ID)?.remove();

  // Reset any layout margins from previous page if sidebar is now closed
  if (!isSidebarOpen) {
    adjustYouTubeLayout(0);
  } else if (isCollapsedStrip) {
    adjustYouTubeLayout(40);
  } else {
    adjustYouTubeLayout(SIDEBAR_WIDTH);
  }

  setTimeout(() => {
    injectCapsuleButton();
  }, 800);


  // Poll for title — YouTube updates it async after navigation
  // Try at 500ms, 1s, 2s, 3s until title stops being stale
  let lastTitle = "";
  let attempts = 0;

  const pollTitle = () => {
    attempts++;
    const video = getCurrentVideoInfo();
    if (!video) return;

    // Keep sending until title stabilises (stops changing)
    if (video.title !== lastTitle) {
      lastTitle = video.title;
      if (isSidebarOpen) {
        sendToSidebar({ type: "CURRENT_VIDEO", video });
      }
    }

    // Poll up to 6 times (covers slow-loading pages)
    if (attempts < 6) {
      setTimeout(pollTitle, 600);
    }
  };

  setTimeout(pollTitle, 500);
}

window.addEventListener("yt-navigate-finish", onYouTubeNavigate);

// Also observe mutations as a fallback (YouTube sometimes doesn't fire the event)
const observer = new MutationObserver(() => {
  if (!document.getElementById(CAPSULE_BTN_ID) && isVideoPage()) {
    injectCapsuleButton();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// ─── Context Menu Injection (⋮ three-dot popup) ─────────────────────────────────

/** The video card the user last clicked three-dots on */
let lastClickedCard: Element | null = null;

/** Extract video info from a card element — handles both classic and newer Polymer YouTube */
function extractVideoInfoFromCard(
  card: Element,
): { videoId: string; title: string; thumbnail: string; url: string } | null {
  let videoId = "";

  // ── Strategy 1: find anchor in light DOM ──────────────────────────────────
  const anchor =
    card.querySelector<HTMLAnchorElement>("a#thumbnail") ??
    card.querySelector<HTMLAnchorElement>("ytd-thumbnail a") ??
    card.querySelector<HTMLAnchorElement>("a.yt-lockup-view-model__content-image") ?? // new homepage lockup
    card.querySelector<HTMLAnchorElement>("a#video-title-link") ??
    card.querySelector<HTMLAnchorElement>('a[href*="watch?v="]') ??
    card.querySelector<HTMLAnchorElement>('a[href*="/shorts/"]');

  if (anchor?.href) {
    try {
      const url = new URL(anchor.href);
      videoId = url.searchParams.get("v") ?? "";
      if (!videoId) {
        const m = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (m) videoId = m[1];
      }
      if (!videoId && url.hostname === "youtu.be") videoId = url.pathname.slice(1);
    } catch { /* ignore */ }
  }

  // ── Strategy 2: extract video ID from thumbnail img src (handles shadow DOM) ──
  if (!videoId) {
    const imgs = card.querySelectorAll<HTMLImageElement>("img");
    for (const img of imgs) {
      const src = img.src || img.getAttribute("src") || "";
      const m = src.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//);
      if (m) { videoId = m[1]; break; }
    }
  }

  // ── Strategy 3: look for data-video-id or similar attributes ──────────────
  if (!videoId) {
    const withId = card.querySelector("[data-video-id]") ??
                   card.querySelector("[video-id]") ??
                   card.querySelector("[videoid]");
    if (withId) videoId = withId.getAttribute("data-video-id") ??
                          withId.getAttribute("video-id") ??
                          withId.getAttribute("videoid") ?? "";
  }

  if (!videoId) {
    console.warn("[Capsule] Could not extract videoId from card:", card.tagName);
    return null;
  }

  // Title
  const titleEl =
    card.querySelector<HTMLElement>("#video-title") ??
    card.querySelector<HTMLElement>("yt-formatted-string#video-title") ??
    card.querySelector<HTMLElement>("h3 a") ??
    card.querySelector<HTMLElement>("h3") ??
    card.querySelector<HTMLElement>(".title") ??
    card.querySelector<HTMLElement>(".yt-lockup-metadata-view-model__title");
  const title = titleEl?.textContent?.trim() || "Unknown video";

  // Thumbnail
  const imgEl = card.querySelector<HTMLImageElement>("img[src*='ytimg'], ytd-thumbnail img");
  const thumbnail =
    (imgEl?.src && !imgEl.src.startsWith("data:")) ? imgEl.src
    : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  console.log("[Capsule] Extracted:", { videoId, title: title.slice(0, 40) });
  return { videoId, title, thumbnail, url: `https://www.youtube.com/watch?v=${videoId}` };
}


/** Build a menu item that looks like YouTube's native items */
function buildCapsuleMenuItem(): HTMLElement {
  const item = document.createElement("div");
  item.className = "capsule-context-item";
  item.setAttribute("role", "menuitem");

  // Avoid innerHTML to bypass YouTube's TrustedHTML restrictions
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.style.flexShrink = "0";

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", "M5 3h14a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z");
  path.setAttribute("fill", "currentColor");
  svg.appendChild(path);

  const span = document.createElement("span");
  span.textContent = "Save to Capsule";

  item.appendChild(svg);
  item.appendChild(span);

  item.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Close the YouTube popup by simulating Escape
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    // Extract info dynamically at click time so we don't hold a stale closure
    // when YouTube reuses the same popup DOM element for a different video.
    if (!lastClickedCard) {
      console.warn("[Capsule] No record of a clicked card. Cannot extract video info.");
      return;
    }
    const info = extractVideoInfoFromCard(lastClickedCard);
    if (!info) {
      console.warn("[Capsule] Could not extract video info from card at click-time.");
      return;
    }

    if (!isSidebarOpen) {
      openSidebar();
    } else if (isCollapsedStrip) {
      sendToSidebar({ type: "EXPAND_SIDEBAR" });
      adjustYouTubeLayout(SIDEBAR_WIDTH);
      isCollapsedStrip = false;
    }

    setTimeout(() => {
      sendToSidebar({ type: "CURRENT_VIDEO", video: info });
      sendToSidebar({ type: "OPEN_SAVE_PANEL" });
    }, isSidebarOpen ? 50 : 650);
  });

  return item;
}

const CARD_SELECTOR = "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, yt-lockup-view-model";

/** Find the card associated with an open popup.
 *  Uses elementFromPoint probing (accurate) then falls back to geometry. */
function findNearestCard(popup: Element): Element | null {
  const rect = popup.getBoundingClientRect();
  if (!rect.width && !rect.height) return lastClickedCard;

  // ── Strategy 1: elementFromPoint probing ──────────────────────────────────
  // The three-dot button is just to the left of the popup (or right for RTL/sidebar).
  // Some popup menus are tall, so we probe multiple vertical offsets.
  const probePoints = [
    { x: rect.left - 20,  y: rect.top + 10 },
    { x: rect.left - 50,  y: rect.top + 20 },
    { x: rect.left - 80,  y: rect.top + 30 },
    { x: rect.left - 20,  y: rect.top - 20 },
    { x: rect.left - 20,  y: Math.max(0, rect.top - 60) },
    { x: rect.right + 20, y: rect.top + 10 }, // for RTL / sidebar popups that open leftward
    { x: rect.right + 50, y: rect.top + 20 },
  ];
  for (const { x, y } of probePoints) {
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
    const el = document.elementFromPoint(x, y);
    if (!el) continue;
    const card = el.closest(CARD_SELECTOR);
    if (card) {
      console.log("[Capsule] Card found via elementFromPoint:", card.tagName);
      return card;
    }
  }

  // ── Strategy 2: geometry (nearest on screen) ──────────────────────────────
  const px = rect.left, py = rect.top;
  const cards = document.querySelectorAll(CARD_SELECTOR);
  let nearest: Element | null = null;
  let minDist = Infinity;
  for (const card of cards) {
    const r = card.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    const dist = Math.hypot(px - (r.left + r.width), py - (r.top + r.height * 0.8));
    if (dist < minDist) { minDist = dist; nearest = card; }
  }

  if (nearest) console.log("[Capsule] Card found via geometry:", nearest.tagName, "dist:", minDist.toFixed(0));
  return nearest;
}

/** Inject the Capsule item into the visible popup panel */
function injectIntoPanelElement(panel: Element, card: Element) {
  if (panel.querySelector(".capsule-context-item")) return;

  const hasItems = panel.querySelector(
    "ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, yt-list-item-view, yt-list-item-view-model",
  );
  if (!hasItems) {
    console.log("[Capsule] Panel has no items yet:", panel.tagName, panel.children.length);
    return;
  }

  const menuItem = buildCapsuleMenuItem();
  panel.appendChild(menuItem);
  console.log("[Capsule] ✓ Injected 'Save to Capsule' into popup");
}

/** Called when a tp-yt-iron-dropdown or yt-sheet-view-model becomes visible */
function onDropdownOpened(dropdown: Element) {
  // Must contain a menu popup
  const panel =
    dropdown.querySelector("ytd-menu-popup-renderer tp-yt-paper-listbox") ??
    dropdown.querySelector("ytd-menu-popup-renderer #items") ??
    dropdown.querySelector("yt-contextual-sheet-layout #items") ?? // yt-sheet-view-model structure
    dropdown.querySelector("yt-list-view-model") ??
    dropdown.querySelector("ytd-menu-popup-renderer") ??
    dropdown; // yt-sheet-view-model itself if it contains items

  if (!panel || !panel.tagName) {
    console.log("[Capsule] Dropdown opened but is not a menu popup:", dropdown.tagName);
    return;
  }

  console.log("[Capsule] Menu popup dropdown opened, panel:", panel.tagName);

  // Find which card this popup belongs to by screen position
  const card = findNearestCard(dropdown) ?? lastClickedCard;
  if (!card) {
    console.log("[Capsule] No nearby card found");
    return;
  }
  lastClickedCard = card;

  // Items may not yet be rendered — retry a few times
  let tries = 0;
  const tryInject = () => {
    tries++;
    injectIntoPanelElement(panel, card);
    const done = panel.querySelector(".capsule-context-item");
    if (!done && tries < 10) setTimeout(tryInject, 80);
  };
  tryInject();
}

/** Probe every dropdown/sheet — returns the first visible one with a menu popup */
function findVisibleMenuDropdown(): Element | null {
  for (const dd of document.querySelectorAll("tp-yt-iron-dropdown, yt-sheet-view-model")) {
    const isSheet = dd.tagName.toLowerCase() === "yt-sheet-view-model";
    
    // Check hidden states
    if (dd.hasAttribute("aria-hidden") || dd.hasAttribute("hidden")) continue;
    if (!isSheet) {
      const style = window.getComputedStyle(dd);
      if (style.display === "none" || style.visibility === "hidden") continue;
    }

    // Sheet uses different internal structure than dropdown
    const popup = isSheet ? dd : dd.querySelector("ytd-menu-popup-renderer");
    if (!popup) continue;
    
    const hasItems = popup.querySelector("ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, yt-list-item-view-model, yt-list-item-view");
    if (hasItems) return popup;
  }
  return null;
}

/** Track tp-yt-iron-dropdown and yt-sheet-view-model visibility. Works even without knowing which button was clicked. */
function setupDropdownTracking() {
  const handled = new WeakSet<Element>();

  function tryHandleDropdown(dd: Element) {
    if (dd.hasAttribute("aria-hidden") || dd.hasAttribute("hidden")) return;
    const popup = dd.querySelector("ytd-menu-popup-renderer");
    if (!popup) return;
    if (handled.has(popup)) return;
    handled.add(popup);
    onDropdownOpened(dd);
  }

  // Observe attribute mutations (aria-hidden, hidden, style) on any dropdown
  const attrObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      const el = m.target as Element;
      const tag = el.tagName?.toLowerCase();
      if (tag !== "tp-yt-iron-dropdown" && tag !== "yt-sheet-view-model") continue;
      tryHandleDropdown(el);
    }
  });

  function observeDropdown(dd: Element) {
    attrObserver.observe(dd, {
      attributes: true,
      attributeFilter: ["aria-hidden", "hidden", "style"],
    });
    // Check immediately in case it's already open
    setTimeout(() => tryHandleDropdown(dd), 0);
  }

  // Watch for new dropdown nodes being added
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        const tag = node.tagName?.toLowerCase();
        if (tag === "tp-yt-iron-dropdown" || tag === "yt-sheet-view-model") {
          observeDropdown(node);
        }
        node.querySelectorAll?.("tp-yt-iron-dropdown, yt-sheet-view-model").forEach(observeDropdown);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Observe all currently-present dropdowns
  document.querySelectorAll("tp-yt-iron-dropdown, yt-sheet-view-model").forEach(observeDropdown);

  // ── POLLING FALLBACK ──────────────────────────────────────────────────────
  // Polls every 300ms regardless of observer events.
  // Cheap: only does real work when a popup is actually open.
  setInterval(() => {
    const popup = findVisibleMenuDropdown();
    if (!popup) return;
    if (popup.querySelector(".capsule-context-item")) return; // already injected

    const dd = popup.closest("tp-yt-iron-dropdown, yt-sheet-view-model") ?? popup;
    if (!handled.has(popup)) {
      handled.add(popup);
      onDropdownOpened(dd);
    } else {
      // already handled but item not there — retry injection directly
      const card = findNearestCard(dd) ?? lastClickedCard;
      if (card) injectIntoPanelElement(popup, card);
    }
  }, 300);

  // Click fallback: record which card any click originated from
  document.addEventListener("click", (e) => {
    const path = e.composedPath() as Element[];
    const card = path.find((el) => {
      const tag = (el as Element)?.tagName?.toLowerCase?.();
      return tag === "ytd-rich-item-renderer" || tag === "ytd-video-renderer" || tag === "ytd-compact-video-renderer" || tag === "yt-lockup-view-model";
    }) as Element | undefined;
    if (card) lastClickedCard = card;
  }, true);

}

// Alias for init()
const contextMenuObserver = { observe: () => {} }; // no-op placeholder so init compiles


// ─── Initialization ───────────────────────────────────────────────────────────

async function init() {
  // Load persisted visibility state
  const result = await chrome.storage.local.get(["capsule-sidebar-open", "capsule-collapsed-strip"]);
  
  if (result["capsule-sidebar-open"]) {
    openSidebar();
  } else {
    adjustYouTubeLayout(0);
  }

  if (result["capsule-collapsed-strip"]) {
    isCollapsedStrip = true;
    adjustYouTubeLayout(40);
  }

  // Inject the capsule button (video pages only)
  injectCapsuleButton();

  // Start watching for three-dot menu popups on card pages
  setupDropdownTracking();

  console.log("[Capsule] Content script initialized ✓");
}


// Run init — document_idle ensures DOM is ready
init();
