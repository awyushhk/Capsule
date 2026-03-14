import type { Folder, Video } from '@prisma/client';

export type FolderWithVideos = Folder & { videos: Video[] };

export interface TreeFolder {
  id: string;
  name: string;
  parentId: string | null;
  videos: Video[];
  children: TreeFolder[];
}

/** Converts a flat list of folders into a nested tree structure */
export function buildTree(folders: FolderWithVideos[]): TreeFolder[] {
  const map = new Map<string, TreeFolder>();
  const roots: TreeFolder[] = [];

  // Initialize map with empty children arrays
  folders.forEach(f => {
    map.set(f.id, { ...f, children: [] });
  });

  // Build the tree
  folders.forEach(f => {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/** Find a folder in the tree by its ID */
export function findFolderInTree(folders: TreeFolder[], id: string): TreeFolder | null {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const found = findFolderInTree(folder.children, id);
    if (found) return found;
  }
  return null;
}

/** Get the path of folders from root to a specific folder */
export function getBreadcrumbs(folders: TreeFolder[], targetId: string): { id: string, name: string }[] {
  function search(currentFolders: TreeFolder[], path: { id: string, name: string }[]): { id: string, name: string }[] | null {
    for (const folder of currentFolders) {
      const newPath = [...path, { id: folder.id, name: folder.name }];
      if (folder.id === targetId) return newPath;
      const result = search(folder.children, newPath);
      if (result) return result;
    }
    return null;
  }
  return search(folders, []) ?? [];
}

/** Count all videos in a folder and all its subfolders */
export function countVideosRecursive(folder: TreeFolder): number {
  let count = folder.videos.length;
  folder.children.forEach(child => {
    count += countVideosRecursive(child);
  });
  return count;
}

/** Get all videos in a folder and its children (flat list) */
export function getAllVideosRecursive(folder: TreeFolder): Video[] {
  let videos = [...folder.videos];
  folder.children.forEach(child => {
    videos = [...videos, ...getAllVideosRecursive(child)];
  });
  return videos;
}
