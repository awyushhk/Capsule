import type { CapsuleData, FolderItem, VideoItem } from '../types';
import { CONFIG } from './config';

const API_BASE = CONFIG.API_BASE_URL;

let getTokenFn: (() => Promise<string | null>) | null = null;

export function setApiTokenFetcher(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  if (!getTokenFn) {
    console.error('[Capsule API] Token fetcher not set. AuthWrapper might not be initialized.');
    throw new Error('[Capsule API] Token fetcher not set');
  }
  const token = await getTokenFn();
  if (!token) {
    console.warn('[Capsule API] No auth token available. User might not be signed in.');
    throw new Error('[Capsule API] No auth token available');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`[Capsule API] ${res.statusText}: ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/** Fetch library and map to CapsuleData tree */
export async function fetchLibrary(): Promise<CapsuleData> {
  const data = await fetchWithAuth('/api/library');
  const folders = data.folders || [];
  const videos = data.videos || [];

  // Build the tree
  const root: FolderItem = {
    id: 'root',
    type: 'folder',
    name: 'root',
    children: [],
    isExpanded: true,
  };

  const folderMap = new Map<string, FolderItem>();
  folderMap.set('root', root);

  // Initialize folders
  folders.forEach((f: any) => {
    folderMap.set(f.id, {
      id: f.id,
      type: 'folder',
      name: f.name || 'Unnamed Folder',
      children: [],
      isExpanded: true,
    });
  });

  // Attach folders to parents (or root)
  folders.forEach((f: any) => {
    const folder = folderMap.get(f.id)!;
    const parentId = f.parentId || 'root';
    const parent = folderMap.get(parentId);
    if (parent) {
      parent.children.push(folder);
    } else {
      root.children.push(folder);
    }
  });

  // Attach root videos
  videos.forEach((v: any) => {
    root.children.push({
      id: v.id,
      type: 'video',
      videoId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      url: v.url,
      dateSaved: new Date(v.createdAt).getTime(),
    });
  });

  // Attach nested videos inside folders
  folders.forEach((f: any) => {
    const folder = folderMap.get(f.id)!;
    if (f.videos && Array.isArray(f.videos)) {
      f.videos.forEach((v: any) => {
        folder.children.push({
          id: v.id,
          type: 'video',
          videoId: v.videoId,
          title: v.title,
          thumbnail: v.thumbnail,
          url: v.url,
          dateSaved: new Date(v.createdAt).getTime(),
        });
      });
    }
  });

  return { root };
}

export async function syncFolderCreate(name: string, parentId?: string) {
  return fetchWithAuth('/api/folders/create', {
    method: 'POST',
    body: JSON.stringify({ name, parentId: parentId === 'root' ? undefined : parentId }),
  });
}

export async function syncFolderRename(id: string, name: string) {
  return fetchWithAuth('/api/folders/rename', {
    method: 'PATCH',
    body: JSON.stringify({ id, name }),
  });
}

export async function syncFolderDelete(id: string) {
  return fetchWithAuth('/api/folders/delete', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function syncVideoAdd(video: Omit<VideoItem, 'id' | 'type' | 'dateSaved'>, folderId?: string) {
  return fetchWithAuth('/api/videos/add', {
    method: 'POST',
    body: JSON.stringify({
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      url: video.url,
      folderId: folderId === 'root' ? undefined : folderId,
    }),
  });
}

export async function syncVideoDelete(id: string) {
  return fetchWithAuth('/api/videos/delete', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function syncVideoMove(id: string, folderId?: string) {
  return fetchWithAuth('/api/videos/move', {
    method: 'PATCH',
    body: JSON.stringify({
      id,
      folderId: folderId === 'root' ? undefined : folderId,
    }),
  });
}
