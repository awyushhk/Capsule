import type { FolderItem, VideoItem, TreeItem } from '../types';

// ─── Tree Traversal ──────────────────────────────────────────────────────────

/** Find a folder by ID (returns null if not found) */
export function findFolderById(node: FolderItem, id: string): FolderItem | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    if (child.type === 'folder') {
      const found = findFolderById(child as FolderItem, id);
      if (found) return found;
    }
  }
  return null;
}

/** Find any item (folder or video) by ID */
export function findItemById(node: FolderItem, id: string): TreeItem | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    if (child.id === id) return child;
    if (child.type === 'folder') {
      const found = findItemById(child as FolderItem, id);
      if (found) return found;
    }
  }
  return null;
}

/** Get the path of folder names from root to a given folder ID */
export function getFolderPath(root: FolderItem, targetId: string): string[] {
  function search(node: FolderItem, path: string[]): string[] | null {
    if (node.id === targetId) return path;
    for (const child of node.children) {
      if (child.type === 'folder') {
        const result = search(child as FolderItem, [...path, (child as FolderItem).name]);
        if (result) return result;
      }
    }
    return null;
  }
  return search(root, []) ?? [];
}

// ─── Tree Mutations (all return new tree — immutable updates) ────────────────

/** Remove an item (folder or video) by ID from anywhere in the tree */
export function removeItemById(node: FolderItem, id: string): FolderItem {
  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== id)
      .map((child) =>
        child.type === 'folder' ? removeItemById(child as FolderItem, id) : child
      ),
  };
}

/** Add an item to a specific folder by folderId */
export function addItemToFolder(
  node: FolderItem,
  folderId: string,
  item: TreeItem
): FolderItem {
  if (node.id === folderId) {
    return { ...node, children: [...node.children, item] };
  }
  return {
    ...node,
    children: node.children.map((child) =>
      child.type === 'folder'
        ? addItemToFolder(child as FolderItem, folderId, item)
        : child
    ),
  };
}

/** Rename a folder by ID */
export function renameFolder(
  node: FolderItem,
  folderId: string,
  newName: string
): FolderItem {
  if (node.id === folderId) {
    return { ...node, name: newName };
  }
  return {
    ...node,
    children: node.children.map((child) =>
      child.type === 'folder'
        ? renameFolder(child as FolderItem, folderId, newName)
        : child
    ),
  };
}

/** Toggle the expanded state of a folder */
export function toggleFolderExpanded(node: FolderItem, folderId: string): FolderItem {
  if (node.id === folderId) {
    return { ...node, isExpanded: !node.isExpanded };
  }
  return {
    ...node,
    children: node.children.map((child) =>
      child.type === 'folder'
        ? toggleFolderExpanded(child as FolderItem, folderId)
        : child
    ),
  };
}

/** Set expanded state of all folders (used for expand all / collapse all) */
export function setAllExpanded(node: FolderItem, expanded: boolean): FolderItem {
  return {
    ...node,
    isExpanded: expanded,
    children: node.children.map((child) =>
      child.type === 'folder' ? setAllExpanded(child as FolderItem, expanded) : child
    ),
  };
}

// ─── Data Extraction ─────────────────────────────────────────────────────────

/** Flatten all videos from the tree into a list with their folder name */
export function getAllVideos(
  node: FolderItem,
  parentName = 'Library'
): (VideoItem & { folderName: string })[] {
  const videos: (VideoItem & { folderName: string })[] = [];

  for (const child of node.children) {
    if (child.type === 'video') {
      videos.push({ ...(child as VideoItem), folderName: parentName });
    } else {
      videos.push(
        ...getAllVideos(child as FolderItem, (child as FolderItem).name)
      );
    }
  }

  return videos;
}

/** Get all folders as a flat list (for folder picker dropdowns) */
export function getAllFolders(node: FolderItem, depth = 0): { folder: FolderItem; depth: number }[] {
  const result: { folder: FolderItem; depth: number }[] = [];

  if (node.id !== 'root') {
    result.push({ folder: node, depth });
  }

  for (const child of node.children) {
    if (child.type === 'folder') {
      result.push(...getAllFolders(child as FolderItem, depth + 1));
    }
  }

  return result;
}

/** Count total videos in tree */
export function countVideos(node: FolderItem): number {
  let count = 0;
  for (const child of node.children) {
    if (child.type === 'video') count++;
    else count += countVideos(child as FolderItem);
  }
  return count;
}

/** Check if a video (by videoId) already exists somewhere in the tree */
export function videoExistsInTree(node: FolderItem, videoId: string): boolean {
  for (const child of node.children) {
    if (child.type === 'video' && (child as VideoItem).videoId === videoId) return true;
    if (child.type === 'folder' && videoExistsInTree(child as FolderItem, videoId)) return true;
  }
  return false;
}

/** Check if a video (by videoId) already exists in a specific folder (direct children only) */
export function videoExistsInFolder(root: FolderItem, folderId: string, videoId: string): boolean {
  const folder = findFolderById(root, folderId) ?? (folderId === 'root' ? root : null);
  if (!folder) return false;
  return folder.children.some(
    (child) => child.type === 'video' && (child as VideoItem).videoId === videoId
  );
}

/** Generate a unique ID */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
