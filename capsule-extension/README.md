Organize YouTube videos into nested folders. A unified, cloud-synced file manager for your YouTube library. Works in tandem with the [Capsule Web Dashboard](../capsule-web).

---

## Quick Start

```bash
npm install
npm run build
# → Load the dist/ folder in Chrome (see below)
```

---

## 📱 Control Panel (Popup)

Capsule now includes a premium **Control Panel** accessible via the extension icon.
- **Enable/Disable**: Instantly toggle the extension's presence on YouTube.
- **Library Stats**: See your total video count at a glance.
- **Direct Access**: Quick-launch button for the Web Dashboard.
- **Premium UI**: Ultra-clean "Apple Control Center" style aesthetics.

---

## Loading in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the **`dist/`** folder
5. Navigate to YouTube. You can now save videos in two ways:
   - Click the **Capsule button** near the Like/Dislike buttons on any video player.
   - Click the **3-dot Action Menu** on _any_ video card (homepage or sidebar) and select **"Save to Capsule"**.

---

## How It Works

```
YouTube Page (content script)
  │
  ├── Injects <iframe src="chrome-extension://ID/sidebar/index.html">
  │     └── React app (CapsuleSidebar)
  │           ├── FolderTree (tree view)
  │           ├── VideoTile grid (tile view)
  │           ├── SaveVideoPanel (save current video)
  │           └── CreateFolderModal
  │
  ├── Injects Capsule button near YouTube's video player actions
  │     └── Click → Opens sidebar synced to the currently playing video
  │
  ├── Monitors YouTube's Popup Menus (3-dot context menus)
  │     └── Injects "Save to Capsule" item into `tp-yt-iron-dropdown` and `yt-sheet-view-model`
  │     └── Click → Opens sidebar synced to the specific video clicked (works on homepage!)
  │
  └── Listens for yt-navigate-finish (YouTube SPA navigation)
        └── Re-injects buttons, resets layout spacing
```

### Message Flow

```
Content Script  ←──postMessage──→  Sidebar iframe

SIDEBAR_READY        ← Sidebar loaded
CURRENT_VIDEO        → Send current video info
NAVIGATE_TO          ← User clicks saved video
GET_CURRENT_VIDEO    ← Sidebar requests video info
```

### Storage Schema

All data is stored in `chrome.storage.local` under the key `capsuleData`:

```json
{
  "capsuleData": {
    "root": {
      "id": "root",
      "type": "folder",
      "name": "root",
      "children": [
        {
          "id": "folder-1234",
          "type": "folder",
          "name": "AI Research",
          "children": [
            {
              "id": "video-5678",
              "type": "video",
              "videoId": "abc123",
              "title": "Attention Is All You Need",
              "thumbnail": "https://img.youtube.com/vi/abc123/hqdefault.jpg",
              "url": "https://www.youtube.com/watch?v=abc123",
              "dateSaved": 1712342342000
            }
          ]
        }
      ]
    }
  }
}
```

---

## Project Structure

```
capsule-extension/
├── manifest.json              # Chrome Extension MV3 manifest
├── vite.config.ts             # Multi-entry Vite build config
├── tailwind.config.js         # Capsule dark theme tokens
├── package.json
│
├── background/
│   └── service-worker.ts      # Extension install/update lifecycle
│
├── content/
│   ├── inject.ts              # Button injection + sidebar iframe + SPA nav
│   └── inject.css             # Iframe positioning + button styles
│
├── sidebar/
│   ├── index.html             # iframe page entry point
│   └── main.tsx               # React root
│
├── components/
│   ├── CapsuleSidebar.tsx     # Main sidebar (header + tree + footer)
│   ├── FolderTree.tsx         # Recursive folder tree (rename, delete, expand)
│   ├── VideoItem.tsx          # Single video row in tree view
│   ├── VideoTile.tsx          # Video card in tile/grid view
│   ├── ViewSwitcher.tsx       # Tree ↔ Tile toggle button
│   ├── SaveVideoPanel.tsx     # Save current video with folder picker
│   └── CreateFolderModal.tsx  # Create folder modal with parent picker
│
├── store/
│   └── capsuleStore.ts        # Zustand store (all state + all actions)
│
├── utils/
│   ├── storage.ts             # chrome.storage.local read/write
│   ├── treeHelpers.ts         # Immutable tree CRUD (add, remove, rename)
│   └── youtubeParser.ts       # Extract videoId/title/thumbnail from page
│
├── types/
│   └── index.ts               # All TypeScript interfaces
│
├── styles/
│   └── globals.css            # Tailwind directives + animations
│
├── scripts/
│   └── postbuild.mjs          # Fixes manifest paths + HTML asset paths
│
└── public/
    └── icons/                 # Extension icons (auto-copied to dist/)
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
```

---

## Development

```bash
# Watch mode — rebuilds on every file save
npm run dev

# After each rebuild, refresh the extension at chrome://extensions
# Then click the ↺ button next to Capsule
```

---

## Features

| Feature                | Description                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Cloud-Sync Native**  | Your library is synced instantly across devices. No local storage limits.                                       |
| **Save from Anywhere** | Save videos straight from the homepage grid or sidebar using the 3-dot context menu.                            |
| **Player Integration** | One-click save from the main video player.                                                                      |
| **Nested Folders**     | Unlimited depth organization, like a real file system.                                                          |
| **Inline Editing**     | Rename folders effortlessly with Enter/Escape.                                                                  |
| **Safe Deletion**      | Two-click confirmation to prevent accidental deletion of folders.                                               |
| **Tree & Tile Views**  | Toggle between a compact folder tree or a visual thumbnail grid.                                                |
| **Universal Search**   | Real-time filtering across all video titles and folder names.                                                   |
| **Quick Playback**     | Click any saved video to instantly navigate YouTube's SPA to that video.                                        |
| **Persistent UI**      | Sidebar stays open across YouTube navigation without breaking the layout.                                       |
| **Control Panel**      | Integrated popup to toggle extension state and view quick stats.                                               |
| **Premium Aesthetic**  | Follows the same glassmorphism design system as the Web Dashboard.                                              |
| **Shadow DOM Ready**   | Advanced element probing to bypass YouTube's TrustedHTML policies and `yt-lockup-view-model` shadow boundaries. |

---

## Troubleshooting

**Menu item doesn't appear on the homepage?**

- You might need to reload the page or click a different 3-dot menu. YouTube aggressively caches and recycles DOM nodes.
- If YouTube rolls out a new layout, the `yt-sheet-view-model` or `yt-lockup-view-model` selectors may need updating.

**Button doesn't appear under the video?**

- Make sure you're on a `<youtube.com/watch?v=...>` page.
- YouTube's DOM loads asynchronously — wait 1–2 seconds after page load.
- Open DevTools Console and look for `[Capsule]` log messages.

**Sidebar layout issues?**

- Ensure `inject.css` is pushing the `ytd-watch-flexy` margin correctly. If content is hidden behind the sidebar, YouTube may have changed their primary layout container ID.

**Data not saving?**

- Check that the extension has `storage` permission (it does per manifest).
- Right-click the sidebar → Inspect → Check the Console for iframe-specific React errors.

---

## Tech Stack

| Tool                      | Purpose                          |
| ------------------------- | -------------------------------- |
| TypeScript                | Type-safe codebase               |
| React 18                  | Sidebar UI                       |
| Vite 5                    | Fast build system                |
| Tailwind CSS              | Utility-first styling            |
| Zustand                   | Lightweight state management     |
| Lucide React              | Icon library                     |
| vite-plugin-web-extension | Extension-aware Vite build       |
| Manifest V3               | Modern Chrome extension standard |

---

## 🌐 Production Alignment

To sync your extension with a deployed dashboard (e.g., Vercel):

1.  **Update Config**: Set the production URL in `utils/config.ts`.
2.  **Sync Host**: Ensure `sidebar/main.tsx` uses the production URL as the Clerk `syncHost`.
3.  **Host Permissions**: Add your production domain to `manifest.json` under `host_permissions`.
4.  **CORS**: Ensure the backend allows requests from `chrome-extension://*` (see web README).

---
