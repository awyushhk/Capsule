// ─── Core Data Types ────────────────────────────────────────────────────────

/** A saved YouTube video */
export interface VideoItem {
  id: string;
  type: 'video';
  videoId: string;
  title: string;
  thumbnail: string;
  url: string;
  dateSaved: number;
}

/** A folder that can contain videos or other folders */
export interface FolderItem {
  id: string;
  type: 'folder';
  name: string;
  children: TreeItem[];
  isExpanded?: boolean;
}

/** Union type for any item in the tree */
export type TreeItem = FolderItem | VideoItem;

/** Root data structure stored in chrome.storage.local */
export interface CapsuleData {
  root: FolderItem;
}

// ─── UI Types ───────────────────────────────────────────────────────────────

/** Sidebar view modes */
export type ViewMode = 'tree' | 'tile';

/** Context menu position */
export interface ContextMenuState {
  x: number;
  y: number;
  targetId: string;
  targetType: 'folder' | 'video';
}

/** Current video info captured from YouTube */
export interface CurrentVideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  url: string;
}

// ─── Message Types (postMessage between content script and sidebar) ──────────

export type ContentToSidebarMessage =
  | { type: 'CURRENT_VIDEO'; video: CurrentVideoInfo }
  | { type: 'TOGGLE_SIDEBAR'; open: boolean }
  | { type: 'EXPAND_SIDEBAR' }
  | { type: 'SET_COLLAPSED'; collapsed: boolean }
  | { type: 'OPEN_SAVE_PANEL' };

export type SidebarToContentMessage =
  | { type: 'NAVIGATE_TO'; url: string }
  | { type: 'SIDEBAR_READY' }
  | { type: 'GET_CURRENT_VIDEO' }
  | { type: 'SIDEBAR_RESIZE'; width: number };
