'use client';

import { useState, useMemo } from 'react';
import { UserButton } from '@clerk/nextjs';
import {
  Bookmark, Search, FolderPlus, List, LayoutGrid,
  Folder, ChevronRight, Play,
  Trash2, ExternalLink, Plus, X, ChevronLeft, Edit2, MoreVertical
} from 'lucide-react';
import type { Video as VideoType } from '@prisma/client';
import { 
  buildTree, 
  findFolderInTree, 
  getBreadcrumbs, 
  type TreeFolder,
  type FolderWithVideos
} from '@/lib/treeHelpers';

interface Props {
  folders: FolderWithVideos[];
  rootVideos: VideoType[];
}

export function DashboardClient({ folders: initialFolders, rootVideos: initialRootVideos }: Props) {
  const [folders, setFolders] = useState(initialFolders);
  const [rootVideos, setRootVideos] = useState(initialRootVideos);
  const [viewMode, setViewMode] = useState<'tree' | 'tile'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addVideoFolder, setAddVideoFolder] = useState('root');
  const [addingVideo, setAddingVideo] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ── Tree Construction ────────────────────────────────────────────────────
  const tree = useMemo(() => buildTree(folders), [folders]);
  const currentFolder = useMemo(() => 
    currentFolderId ? findFolderInTree(tree, currentFolderId) : null
  , [tree, currentFolderId]);

  const breadcrumbs = useMemo(() => 
    currentFolderId ? getBreadcrumbs(tree, currentFolderId) : []
  , [tree, currentFolderId]);

  const allVideos = useMemo(() => [
    ...rootVideos.map(v => ({ ...v, folderName: 'Library' })),
    ...folders.flatMap(f => f.videos.map(v => ({ ...v, folderName: f.name }))),
  ], [rootVideos, folders]);

  const filteredVideos = searchQuery
    ? allVideos.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.folderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddVideo = async () => {
    if (!addVideoUrl.trim()) return;
    setAddingVideo(true);
    try {
      const res = await fetch('/api/videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: addVideoUrl,
          folderId: addVideoFolder === 'root' ? null : addVideoFolder,
        }),
      });
      const video = await res.json();
      if (addVideoFolder === 'root') {
        setRootVideos(prev => [...prev, video]);
      } else {
        setFolders(prev => prev.map(f =>
          f.id === addVideoFolder ? { ...f, videos: [...f.videos, video] } : f
        ));
      }
      setAddVideoUrl('');
      setShowAddVideo(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingVideo(false);
    }
  };

  const handleCreateFolder = async (parentId: string | null = null) => {
    if (!newFolderName.trim() || isCreatingFolder) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch('/api/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId }),
      });
      const folder = await res.json();
      setFolders(prev => [...prev, { ...folder, videos: [] }]);
      setNewFolderName('');
      setShowNewFolder(false);
      setNewFolderParentId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolderName.trim() || !renamingFolderId) return;
    try {
      const res = await fetch('/api/folders/rename', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: renamingFolderId, name: editingFolderName }),
      });
      const updated = await res.json();
      setFolders(prev => prev.map(f => f.id === renamingFolderId ? { ...f, name: updated.name } : f));
      setRenamingFolderId(null);
      setEditingFolderName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await fetch('/api/videos/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setRootVideos(prev => prev.filter(v => v.id !== id));
    setFolders(prev => prev.map(f => ({ ...f, videos: f.videos.filter(v => v.id !== id) })));
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder and all its videos?')) return;
    try {
      await fetch('/api/folders/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setFolders(prev => prev.filter(f => f.id !== id));
      if (currentFolderId === id) setCurrentFolderId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      
      {/* ── Desktop Sidebar / Mobile Drawer ────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}
        glass-panel-heavy md:glass-panel border-r border-panel-border/30
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setCurrentFolderId(null); setShowMobileMenu(false); }}>
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                <Bookmark size={16} className="text-white fill-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">Capsule</span>
            </div>
            <button onClick={() => setShowMobileMenu(false)} className="md:hidden text-muted hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
            <section>
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Library</span>
                <button
                  onClick={() => { setShowNewFolder(true); setNewFolderParentId(null); }}
                  className="p-1 hover:bg-white/5 rounded-md transition-all text-muted hover:text-white"
                >
                  <FolderPlus size={14} />
                </button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => { setCurrentFolderId(null); setShowMobileMenu(false); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${currentFolderId === null ? 'bg-accent/10 text-accent font-medium' : 'text-muted hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <Folder size={16} className={currentFolderId === null ? 'text-accent' : 'text-muted'} />
                  All Library
                </button>

                {tree.map(folder => (
                  <SidebarFolder 
                    key={folder.id} 
                    folder={folder} 
                    currentFolderId={currentFolderId}
                    setCurrentFolderId={setCurrentFolderId}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    onAddSubfolder={(pid) => { setShowNewFolder(true); setNewFolderParentId(pid); }}
                    onRename={(id, name) => { setRenamingFolderId(id); setEditingFolderName(name); }}
                    onDelete={(id) => handleDeleteFolder(id)}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-panel-border">
            <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-secondary/30">
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">My Account</p>
                <p className="text-[10px] text-muted truncate">Manage settings</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="glass-header h-20 px-4 md:px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 bg-secondary rounded-xl text-white flex-shrink-0"
            >
              <List size={20} />
            </button>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="hidden md:flex items-center gap-3 text-sm font-medium text-muted">
                <button 
                  onClick={() => setCurrentFolderId(null)}
                  className="hover:text-white transition-colors flex-shrink-0"
                >
                  Library
                </button>
                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-3 min-w-0">
                    <ChevronRight size={14} className="opacity-30 flex-shrink-0" />
                    <button 
                      onClick={() => setCurrentFolderId(crumb.id)}
                      className={`
                        hover:text-white transition-colors truncate
                        ${idx === breadcrumbs.length - 1 ? 'text-white' : ''}
                      `}
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>
              <div className="md:hidden truncate font-bold">
                {currentFolder ? currentFolder.name : 'My Library'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-4">
            {/* Search */}
            <div className="relative group hidden sm:block">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-secondary/50 border border-panel-border rounded-xl pl-10 pr-4 py-2 text-sm w-40 md:w-64 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
              />
            </div>

            {/* View Switching */}
            <div className="flex bg-secondary/50 border border-panel-border rounded-xl p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'tree' ? 'bg-white shadow-sm text-black' : 'text-muted hover:text-white'}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('tile')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'tile' ? 'bg-white shadow-sm text-black' : 'text-muted hover:text-white'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            <button
              onClick={() => { setShowAddVideo(true); setAddVideoFolder(currentFolderId || 'root'); }}
              className="bg-accent hover:bg-accent-hover text-white p-2 md:px-4 md:py-2 rounded-xl border border-white/5 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-accent/10"
            >
              <Plus size={18} />
              <span className="hidden lg:inline font-semibold text-sm">Add</span>
            </button>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-0 md:p-8 scroll-smooth">
          {searchQuery ? (
            /* ── Search Results ────────────────────────────────────────── */
            <div className="animate-fade-in max-w-7xl mx-auto p-4 md:p-0">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-bold text-muted uppercase tracking-widest">
                  Found {filteredVideos.length} result{filteredVideos.length !== 1 ? 's' : ''}
                </h2>
                <button onClick={() => setSearchQuery('')} className="text-xs text-accent hover:underline">Clear search</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {filteredVideos.map(video => (
                  <VideoCard key={video.id} video={video} onDelete={handleDeleteVideo} />
                ))}
              </div>
              {filteredVideos.length === 0 && <EmptyState message="No videos match your search." />}
            </div>
          ) : (
            /* ── Folder Browser ─────────────────────────────────────────── */
            <div className="animate-fade-in max-w-7xl mx-auto space-y-8 md:space-y-12 pb-20 md:pb-0">
              
              {/* Back Button for Drill-down */}
              {currentFolderId && (
                <button 
                  onClick={() => {
                    const parent = breadcrumbs[breadcrumbs.length - 2];
                    setCurrentFolderId(parent ? parent.id : null);
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-white p-4 md:p-2 md:-ml-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}

              {/* Display Folders first in Tile/Tree View */}
              {(currentFolder ? currentFolder.children : tree).length > 0 && (
                <section className="px-4 md:px-0">
                  <h2 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-3">
                    Subfolders <div className="h-px flex-1 bg-white/5" />
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {(currentFolder ? currentFolder.children : tree).map(f => (
                      <div 
                        key={f.id}
                        onClick={() => { setCurrentFolderId(f.id); toggleFolder(f.id); }}
                        className="glass-panel group p-2 md:p-4 rounded-xl md:rounded-2xl flex flex-col items-center gap-1.5 md:gap-3 cursor-pointer hover:bg-white/[0.03] hover:border-accent/30 hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="w-9 h-9 md:w-12 md:h-12 bg-amber-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                          <Folder size={18} className="fill-current md:w-[24px] md:h-[24px]" />
                        </div>
                        <div className="text-center min-w-0 w-full relative group/folder">
                          <p className="text-[11px] md:text-sm font-semibold truncate group-hover:text-amber-200 transition-colors">{f.name}</p>
                          <p className="text-[9px] md:text-[10px] text-muted font-mono">{f.videos.length} videos</p>
                          
                          <div className="absolute top-1 right-0 flex items-center gap-1 md:gap-2 opacity-0 group-hover/folder:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setRenamingFolderId(f.id); setEditingFolderName(f.name); }}
                              className="p-1 text-muted hover:text-white"
                            >
                              <Edit2 size={10} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                              className="p-1 text-muted hover:text-accent"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Root/Folder Videos */}
              <section className="px-0 md:px-0">
                <div className="flex items-center justify-between mb-4 md:mb-6 group/sec px-4 md:px-0">
                  <h2 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] flex items-center gap-3 flex-1">
                    <span className="text-white">Videos</span> <div className="h-px flex-1 bg-white/5 group-hover/sec:bg-accent/20 transition-colors" />
                  </h2>
                </div>
                
                {viewMode === 'tile' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {(currentFolder ? currentFolder.videos : rootVideos).map(v => (
                      <VideoCard key={v.id} video={{ ...v, folderName: currentFolder?.name || 'Library' }} onDelete={handleDeleteVideo} />
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel md:rounded-3xl overflow-hidden divide-y divide-white/[0.02] mx-4 md:mx-0">
                    {(currentFolder ? currentFolder.videos : rootVideos).map(v => (
                      <VideoRow key={v.id} video={{ ...v, folderName: currentFolder?.name || 'Library' }} onDelete={handleDeleteVideo} hideFolder />
                    ))}
                  </div>
                )}

                {(currentFolder ? currentFolder.videos : rootVideos).length === 0 && (currentFolder ? currentFolder.children : tree).length === 0 && (
                  <EmptyState />
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showAddVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" onClick={() => setShowAddVideo(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold">Add to Capsule</h2>
                <p className="text-xs text-muted">Paste a YouTube URL to save it forever.</p>
              </div>
              <button 
                onClick={() => setShowAddVideo(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">URL</label>
                <input
                  value={addVideoUrl}
                  onChange={e => setAddVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-secondary/50 border border-panel-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">Select Folder</label>
                <select
                  value={addVideoFolder}
                  onChange={e => setAddVideoFolder(e.target.value)}
                  className="w-full bg-secondary/50 border border-panel-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 appearance-none cursor-pointer"
                >
                  <option value="root">General Library (root)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleAddVideo}
                disabled={addingVideo || !addVideoUrl.trim()}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
              >
                {addingVideo ? 'Syncing...' : 'Add to My Library'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" onClick={() => setShowNewFolder(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative glass-panel rounded-3xl p-8 w-full max-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">New Folder</h2>
            <p className="text-xs text-muted mb-6">Create a new space for your collections.</p>
            
            <div className="space-y-4">
              <input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder(newFolderParentId)}
                placeholder="Folder name..."
                autoFocus
                className="w-full bg-secondary/50 border border-panel-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/40"
              />
              <button
                onClick={() => handleCreateFolder(newFolderParentId)}
                disabled={!newFolderName.trim() || isCreatingFolder}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isCreatingFolder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renamingFolderId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" onClick={() => setRenamingFolderId(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative glass-panel rounded-3xl p-8 w-full max-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Rename Folder</h2>
            <p className="text-xs text-muted mb-6">Enter a new name for your collection.</p>
            
            <div className="space-y-4">
              <input
                value={editingFolderName}
                onChange={e => setEditingFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRenameFolder()}
                placeholder="New folder name..."
                autoFocus
                className="w-full bg-secondary/50 border border-panel-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/40"
              />
              <button
                onClick={handleRenameFolder}
                disabled={!editingFolderName.trim()}
                className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Rename Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarFolder({ 
  folder, 
  currentFolderId, 
  setCurrentFolderId, 
  expandedFolders, 
  toggleFolder,
  onAddSubfolder,
  onRename,
  onDelete
}: { 
  folder: TreeFolder, 
  currentFolderId: string | null, 
  setCurrentFolderId: (id: string | null) => void,
  expandedFolders: Set<string>,
  toggleFolder: (id: string) => void,
  onAddSubfolder: (parentId: string) => void,
  onRename: (id: string, name: string) => void,
  onDelete: (id: string) => void
}) {
  const isExpanded = expandedFolders.has(folder.id);
  const isActive = currentFolderId === folder.id;

  return (
    <div className="group">
      <div 
        className={`
          flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer relative
          ${isActive ? 'bg-amber-500/10 text-amber-200' : 'text-muted hover:bg-white/5 hover:text-white'}
        `}
        onClick={(e) => {
          e.stopPropagation();
          setCurrentFolderId(folder.id);
          if (!isExpanded) toggleFolder(folder.id);
        }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
          className="p-0.5 hover:bg-white/10 rounded-md transition-colors"
        >
          <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
        <Folder size={16} className={isExpanded || isActive ? 'text-amber-500' : 'text-muted'} />
        <span className="flex-1 truncate">{folder.name}</span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onAddSubfolder(folder.id); }}
            className="p-1 hover:text-white"
          >
            <Plus size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRename(folder.id, folder.name); }}
            className="p-1 hover:text-white"
          >
            <Edit2 size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
            className="p-1 hover:text-accent"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      {isExpanded && folder.children.length > 0 && (
        <div className="ml-5 border-l border-white/5 pl-2 mt-1 space-y-1 animate-fade-in">
          {folder.children.map(child => (
            <SidebarFolder 
              key={child.id} 
              folder={child} 
              currentFolderId={currentFolderId}
              setCurrentFolderId={setCurrentFolderId}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onAddSubfolder={onAddSubfolder}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, onDelete }: { video: VideoType & { folderName: string }; onDelete: (id: string) => void }) {
  return (
    <div className="group relative bg-secondary/20 border border-panel-border md:rounded-2xl overflow-hidden transition-all duration-300 md:hover:shadow-2xl md:hover:shadow-black/50 md:hover:border-white/10 md:hover:-translate-y-1.5 animate-fade-in">
      <a href={video.url} target="_blank" rel="noreferrer" className="block">
        <div className="relative aspect-video bg-secondary overflow-hidden">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-xl shadow-accent/40">
              <Play size={18} className="text-white fill-white ml-1" />
            </div>
          </div>
        </div>
        <div className="p-3 md:p-4">
          <h3 className="text-[12px] md:text-xs font-semibold leading-snug line-clamp-2 mb-1.5 md:mb-2 min-h-[2rem] md:min-h-[2.4rem] group-hover:text-white transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[9px] md:text-[10px] text-muted font-mono flex items-center gap-1.5">
              <Folder size={10} className="text-amber-500/60" /> {video.folderName}
            </span>
          </div>
        </div>
      </a>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(video.id); }}
        className="absolute top-2 right-2 md:top-3 md:right-3 w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-black/60 backdrop-blur-md flex items-center justify-center text-white/50 hover:bg-accent hover:text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function VideoRow({ video, onDelete, hideFolder }: { video: VideoType & { folderName: string }; onDelete: (id: string) => void, hideFolder?: boolean }) {
  return (
    <div className="group flex items-center gap-4 py-3 px-4 hover:bg-white/[0.03] transition-all">
      <div className="relative w-20 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-secondary shadow-lg shadow-black/40">
        <img src={video.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-medium text-white/80 group-hover:text-white truncate transition-colors leading-relaxed">
          {video.title}
        </h4>
        {!hideFolder && (
          <p className="text-[10px] text-muted font-mono mt-0.5">{video.folderName}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <a 
          href={video.url} 
          target="_blank" 
          rel="noreferrer" 
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-muted hover:text-white hover:bg-secondary-hover transition-all"
        >
          <ExternalLink size={14} />
        </a>
        <button 
          onClick={() => onDelete(video.id)} 
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-muted hover:text-accent hover:bg-accent/10 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in px-6">
      <div className="w-20 h-20 rounded-[1.5rem] glass-panel flex items-center justify-center mb-8 shadow-2xl">
        <Bookmark size={28} className="text-accent/20" />
      </div>
      <h2 className="text-lg font-bold mb-2 tracking-tight">{message || 'This folder is empty'}</h2>
      <p className="max-w-xs text-xs text-muted leading-relaxed">
        {message ? '' : 'Add videos here to keep them organized and accessible.'}
      </p>
    </div>
  );
}