import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { FolderItem, VideoItem, ViewMode, CurrentVideoInfo } from '../types';
import {
  fetchLibrary,
  syncFolderCreate,
  syncFolderRename,
  syncFolderDelete,
  syncVideoAdd,
  syncVideoDelete,
  syncVideoMove,
} from '../utils/api';
import {
  findItemById,
  addItemToFolder,
  renameFolder,
  removeItemById,
  toggleFolderExpanded,
  setAllExpanded,
  applyExpansionState,
} from '../utils/treeHelpers';

// ─── State Interface ──────────────────────────────────────────────────────────

interface CapsuleState {
  // Data
  root: FolderItem;
  isLoaded: boolean;

  // UI
  viewMode: ViewMode;
  searchQuery: string;
  selectedFolderId: string | null;
  currentVideo: CurrentVideoInfo | null;
  expandedFolders: Set<string>;

  // Actions — Data
  fetchLibrary: () => Promise<void>;
  createFolder: (parentId: string, name: string) => Promise<void>;
  renameFolderById: (folderId: string, newName: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  addVideo: (folderId: string, video: Omit<VideoItem, 'id' | 'type' | 'dateSaved'>) => Promise<void>;
  deleteVideo: (videoId: string) => Promise<void>;
  moveVideo: (videoId: string, folderId: string) => Promise<void>;
  toggleFolder: (folderId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Actions — UI
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFolder: (folderId: string | null) => void;
  setCurrentVideo: (video: CurrentVideoInfo | null) => void;
}

// ─── Default Root ─────────────────────────────────────────────────────────────

const defaultRoot: FolderItem = {
  id: 'root',
  type: 'folder',
  name: 'root',
  children: [],
  isExpanded: true,
};

// ─── Persistence Helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'capsule_expanded_folders';

function getStoredExpanded(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set(['root']);
  } catch {
    return new Set(['root']);
  }
}

function saveStoredExpanded(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCapsuleStore = create<CapsuleState>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial State ─────────────────────────────────────────────────────────
    root: defaultRoot,
    isLoaded: false,
    viewMode: 'tree',
    searchQuery: '',
    selectedFolderId: 'root',
    currentVideo: null,
    expandedFolders: getStoredExpanded(),

    // ── API Sync Data ─────────────────────────────────────────────────────────

    fetchLibrary: async () => {
      try {
        const data = await fetchLibrary();
        const expandedIds = get().expandedFolders;
        set({ 
          root: applyExpansionState(data.root, expandedIds), 
          isLoaded: true 
        });
      } catch (err) {
        console.error('[Capsule] Failed to fetch data from API:', err);
        set({ isLoaded: true });
      }
    },

    // ── Folder CRUD (Optimistic) ──────────────────────────────────────────────

    createFolder: async (parentId, name) => {
      const prevRoot = get().root;
      const optimisticId = `temp-${Date.now()}`;
      
      // 1. Optimistic Update
      const newFolder: FolderItem = {
        id: optimisticId,
        type: 'folder',
        name: name.trim() || 'New Folder',
        children: [],
        isExpanded: false
      };
      
      set({ 
        root: addItemToFolder(prevRoot, parentId, newFolder),
        selectedFolderId: optimisticId
      });

      // 2. Background Sync
      try {
        const response = await syncFolderCreate(newFolder.name, parentId);
        // Refresh to get real IDs from server
        await get().fetchLibrary();
        if (response?.id) set({ selectedFolderId: response.id });
      } catch (err) {
        console.error('[Capsule] Failed to create folder, rolling back:', err);
        set({ root: prevRoot, selectedFolderId: 'root' });
        // TODO: Show toast error
      }
    },

    renameFolderById: async (folderId, newName) => {
      const prevRoot = get().root;
      const cleanName = newName.trim() || 'Folder';

      // 1. Optimistic Update
      set({ root: renameFolder(prevRoot, folderId, cleanName) });

      // 2. Background Sync
      try {
        await syncFolderRename(folderId, cleanName);
        // fetchLibrary is optional here if we trust our local rename
      } catch (err) {
        console.error('[Capsule] Failed to rename folder, rolling back:', err);
        set({ root: prevRoot });
      }
    },

    deleteFolder: async (folderId) => {
      const prevRoot = get().root;
      const prevSelected = get().selectedFolderId;

      // 1. Optimistic Update
      set({ 
        root: removeItemById(prevRoot, folderId),
        selectedFolderId: prevSelected === folderId ? 'root' : prevSelected
      });

      // 2. Background Sync
      try {
        await syncFolderDelete(folderId);
      } catch (err) {
        console.error('[Capsule] Failed to delete folder, rolling back:', err);
        set({ root: prevRoot, selectedFolderId: prevSelected });
      }
    },

    // ── Video CRUD (Optimistic) ───────────────────────────────────────────────

    addVideo: async (folderId, videoData) => {
      const prevRoot = get().root;
      const optimisticId = `temp-v-${Date.now()}`;

      // 1. Optimistic Update
      const newVideo: VideoItem = {
        ...videoData,
        id: optimisticId,
        type: 'video',
        dateSaved: Date.now()
      };

      set({ root: addItemToFolder(prevRoot, folderId, newVideo) });

      // 2. Background Sync
      try {
        await syncVideoAdd(videoData, folderId);
        await get().fetchLibrary(); // Refresh for real ID
      } catch (err) {
        console.error('[Capsule] Failed to add video, rolling back:', err);
        set({ root: prevRoot });
      }
    },

    deleteVideo: async (videoId) => {
      const prevRoot = get().root;

      // 1. Optimistic Update
      set({ root: removeItemById(prevRoot, videoId) });

      // 2. Background Sync
      try {
        await syncVideoDelete(videoId);
      } catch (err) {
        console.error('[Capsule] Failed to delete video, rolling back:', err);
        set({ root: prevRoot });
      }
    },

    moveVideo: async (videoId, folderId) => {
      const prevRoot = get().root;
      const item = findItemById(prevRoot, videoId);
      if (!item || item.type !== 'video') return;

      // 1. Optimistic Update
      const intermediateRoot = removeItemById(prevRoot, videoId);
      set({ root: addItemToFolder(intermediateRoot, folderId, item) });

      // 2. Background Sync
      try {
        await syncVideoMove(videoId, folderId);
      } catch (err) {
        console.error('[Capsule] Failed to move video, rolling back:', err);
        set({ root: prevRoot });
      }
    },

    // ── Folder Expansion (Memory only) ────────────────────────────────────────

    toggleFolder: (folderId) => {
      set((state) => {
        const newExpanded = new Set(state.expandedFolders);
        if (newExpanded.has(folderId)) {
          newExpanded.delete(folderId);
        } else {
          newExpanded.add(folderId);
        }
        saveStoredExpanded(newExpanded);

        const newRoot = toggleFolderExpanded(state.root, folderId);
        return { root: newRoot, expandedFolders: newExpanded };
      });
    },

    expandAll: () => {
      set((state) => {
        const newRoot = setAllExpanded(state.root, true);
        return { root: newRoot };
      });
    },

    collapseAll: () => {
      set((state) => {
        const newRoot = setAllExpanded(state.root, false);
        return { root: newRoot };
      });
    },

    // ── UI State ──────────────────────────────────────────────────────────────

    setViewMode: (mode) => set({ viewMode: mode }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),
    setCurrentVideo: (video) => set({ currentVideo: video }),
  }))
);
