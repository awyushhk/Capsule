import { useState, useEffect, useCallback } from "react";
import {
  FolderPlus,
  Search,
  X,
  ChevronRight,
  Bookmark,
  BookmarkPlus,
  Settings,
} from "lucide-react";
import { useCapsuleStore } from "../store/capsuleStore";
import { FolderTree } from "./FolderTree";
import { ViewSwitcher } from "./ViewSwitcher";
import { CreateFolderModal } from "./CreateFolderModal";
import { SaveVideoPanel } from "./SaveVideoPanel";
import { getAllVideos } from "../utils/treeHelpers";
import type {
  ContentToSidebarMessage,
  SidebarToContentMessage,
} from "../types";

export function CapsuleSidebar() {
  const {
    root,
    isLoaded,
    viewMode,
    searchQuery,
    currentVideo,
    setViewMode,
    setSearchQuery,
    setCurrentVideo,
    fetchLibrary,
    deleteVideo,
  } = useCapsuleStore();

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState("root");
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ── Load data on mount ───────────────────────────────────────────────────

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // ── postMessage bridge with content script ───────────────────────────────

  const sendToContent = useCallback((msg: SidebarToContentMessage) => {
    window.parent.postMessage({ source: "capsule-sidebar", ...msg }, "*");
  }, []);

  useEffect(() => {
    sendToContent({ type: "SIDEBAR_READY" });

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as ContentToSidebarMessage & { source?: string };
      if (data?.source !== "capsule-content") return;
      if (data.type === "CURRENT_VIDEO") {
        setCurrentVideo(data.video);
      }
      if (data.type === "EXPAND_SIDEBAR") {
        setIsCollapsed(false);
      }
      if (data.type === "SET_COLLAPSED") {
        setIsCollapsed(data.collapsed);
      }
      if (data.type === "OPEN_SAVE_PANEL") {
        setIsCollapsed(false);
        setShowSavePanel(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sendToContent, setCurrentVideo]);

  // ── Video playback ───────────────────────────────────────────────────────

  const handlePlay = useCallback(
    (url: string) => {
      sendToContent({ type: "NAVIGATE_TO", url });
    },
    [sendToContent],
  );

  // Tell content script to adjust YouTube layout for collapsed width
  useEffect(() => {
    sendToContent({ type: "SIDEBAR_RESIZE", width: isCollapsed ? 40 : 340 });
  }, [isCollapsed, sendToContent]);

  // ── Subfolder creation ───────────────────────────────────────────────────

  const handleCreateSubfolder = (parentId: string) => {
    setCreateFolderParentId(parentId);
    setIsCreateFolderOpen(true);
  };

  // ── Search ───────────────────────────────────────────────────────────────

  const allVideos = getAllVideos(root);
  const totalVideos = allVideos.length;

  const filteredVideos = searchQuery.trim()
    ? allVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.folderName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allVideos;

  // ─── Collapsed strip ─────────────────────────────────────────────────────

  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-0 h-screen w-10 bg-[#0A0A0A] border-l border-[#1C1C1C] flex flex-col items-center py-3 gap-3 z-[9999]">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 rounded-lg bg-[#FF2D2D] flex items-center justify-center text-white shadow-md shadow-[#FF2D2D]/20 hover:bg-[#CC2424] transition-colors"
          title="Open Capsule"
        >
          <ChevronRight size={14} />
        </button>
        <div className="w-0.5 flex-1 bg-[#1C1C1C] rounded-full" />
        <span
          className="text-[10px] text-[#444] font-mono"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {totalVideos} videos
        </span>
      </div>
    );
  }

  // ─── Full sidebar ─────────────────────────────────────────────────────────

  return (
    <div className="fixed right-0 top-0 h-screen w-[340px] bg-[#0A0A0A] border-l border-[#1C1C1C] flex flex-col z-[9999] font-sans">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#1C1C1C] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#FF2D2D] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#FF2D2D]/30">
            <Bookmark size={12} className="text-white fill-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#E8E8E8] font-display tracking-tight leading-none">
              Capsule
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-[#444] font-mono">
                {totalVideos} videos
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ViewSwitcher mode={viewMode} onModeChange={setViewMode} />
          <button
            onClick={() => {
              setCreateFolderParentId("root");
              setIsCreateFolderOpen(true);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#666] hover:text-[#F5A623] hover:bg-[#F5A623]/10 transition-colors"
            title="New folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#666] hover:text-[#E8E8E8] hover:bg-[#1C1C1C] transition-colors"
            title="Collapse sidebar"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Save current video banner ─────────────────────────────────── */}
      {currentVideo && (
        <div
          className="flex-shrink-0 border-b border-[#1C1C1C]"
          style={{ overflow: "visible" }}
        >
          {showSavePanel ? (
            <div className="pt-3">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-[#E8E8E8] font-display">
                  Save Video
                </span>
                <button
                  onClick={() => setShowSavePanel(false)}
                  className="w-5 h-5 flex items-center justify-center rounded text-[#666] hover:text-[#E8E8E8] hover:bg-[#2A2A2A] transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
              <SaveVideoPanel onClose={() => setShowSavePanel(false)} />
            </div>
          ) : (
            <button
              onClick={() => setShowSavePanel(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#141414] transition-colors group"
            >
              <img
                src={currentVideo.thumbnail}
                alt=""
                className="w-10 h-7 rounded object-cover bg-[#1C1C1C] flex-shrink-0"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.opacity = "0")
                }
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs text-[#AAAAAA] group-hover:text-[#E8E8E8] transition-colors truncate leading-snug">
                  {currentVideo.title}
                </p>
                <p className="text-[10px] text-[#444] font-mono mt-0.5">
                  tap to save →
                </p>
              </div>
              <BookmarkPlus
                size={13}
                className="text-[#555] group-hover:text-[#FF2D2D] transition-colors flex-shrink-0"
              />
            </button>
          )}
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
        {!isLoaded ? (
          /* ── Loading ── */
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-[#FF2D2D]/30 border-t-[#FF2D2D] rounded-full animate-spin" />
              <span className="text-xs text-[#444] font-mono">loading...</span>
            </div>
          </div>
        ) : searchQuery.trim() ? (
          /* ── Search results (flat list, works in both view modes) ── */
          <div className="py-2 px-2">
            <p className="text-[10px] text-[#555] font-mono px-2 mb-2">
              {filteredVideos.length} result
              {filteredVideos.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
            {filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Search size={18} className="text-[#333]" />
                <p className="text-xs text-[#444]">No videos found</p>
              </div>
            ) : (
              filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1C1C1C] transition-colors cursor-pointer"
                  onClick={() => handlePlay(video.url)}
                >
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="w-10 h-7 rounded object-cover bg-[#1C1C1C] flex-shrink-0"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.opacity = "0")
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#CCCCCC] truncate group-hover:text-[#E8E8E8]">
                      {video.title}
                    </p>
                    <p className="text-[10px] text-[#444] font-mono">
                      {video.folderName}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteVideo(video.id);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded text-[#555] hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ── Folder tree — handles BOTH tree and tile view internally ── */
          /* In tree mode: folders + video rows                             */
          /* In tile mode: folders as rows, videos as tile cards            */
          <FolderTree
            onPlay={handlePlay}
            onCreateSubfolder={handleCreateSubfolder}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[#1C1C1C] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#141414] border border-[#1E1E1E] hover:border-[#2A2A2A] focus-within:border-[#FF2D2D]/40 rounded-lg px-2.5 py-1.5 transition-colors">
            <Search size={11} className="text-[#444] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="flex-1 bg-transparent text-xs text-[#E8E8E8] placeholder-[#3A3A3A] focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#444] hover:text-[#E8E8E8] transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#444] hover:text-[#E8E8E8] hover:bg-[#1C1C1C] transition-colors"
            title="Settings (coming soon)"
          >
            <Settings size={13} />
          </button>
        </div>
        <p className="text-center text-[9px] text-[#2A2A2A] font-mono mt-2 tracking-widest uppercase">
          Capsule — your video library
        </p>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        defaultParentId={createFolderParentId}
      />
    </div>
  );
}
