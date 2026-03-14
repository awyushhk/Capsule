import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { FolderItem, VideoItem as VideoItemType } from "../types";
import { VideoItem } from "./VideoItem";
import { VideoTile } from "./VideoTile";
import { useCapsuleStore } from "../store/capsuleStore";

// ─── Single Folder Node ───────────────────────────────────────────────────────

interface FolderNodeProps {
  folder: FolderItem;
  depth?: number;
  onPlay: (url: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  viewMode?: "tree" | "tile";
}

function FolderNode({
  folder,
  depth = 0,
  onPlay,
  onCreateSubfolder,
  viewMode = "tree",
}: FolderNodeProps) {
  const {
    toggleFolder,
    renameFolderById,
    deleteFolder,
    deleteVideo,
    selectedFolderId,
    setSelectedFolder,
  } = useCapsuleStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedFolderId === folder.id;
  const isExpanded = folder.isExpanded ?? true;

  const videoCount = folder.children.filter((c) => c.type === "video").length;
  const folderCount = folder.children.filter((c) => c.type === "folder").length;

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  const handleRenameCommit = () => {
    renameFolderById(folder.id, renameValue);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter") handleRenameCommit();
    if (e.key === "Escape") {
      setRenameValue(folder.name);
      setIsRenaming(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${folder.name}" and all its contents?`)) {
      deleteFolder(folder.id);
    }
  };

  const indentPx = depth * 14;

  // Separate folders and videos from children
  const childFolders = folder.children.filter(
    (c) => c.type === "folder",
  ) as FolderItem[];
  const childVideos = folder.children.filter(
    (c) => c.type === "video",
  ) as VideoItemType[];
  const isEmpty = folder.children.length === 0;

  return (
    <div>
      {/* ── Folder Row ── */}
      <div
        style={{ paddingLeft: `${8 + indentPx}px` }}
        className={`group flex items-center gap-1.5 pr-1 py-1.5 rounded-md cursor-pointer select-none transition-colors relative ${
          isSelected
            ? "bg-[#FF2D2D]/10 text-[#E8E8E8]"
            : "hover:bg-[#1C1C1C] text-[#CCCCCC]"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          toggleFolder(folder.id);
          setSelectedFolder(folder.id);
        }}
      >
        {/* Expand arrow */}
        <ChevronRight
          size={12}
          className={`flex-shrink-0 text-[#555] transition-transform duration-150 ${
            isExpanded ? "rotate-90" : ""
          } ${folder.children.length === 0 ? "opacity-0" : ""}`}
        />

        {/* Folder icon */}
        {isExpanded && folder.children.length > 0 ? (
          <FolderOpen size={14} className="flex-shrink-0 text-[#F5A623]" />
        ) : (
          <Folder
            size={14}
            className={`flex-shrink-0 ${
              folder.children.length > 0 ? "text-[#F5A623]" : "text-[#555]"
            }`}
          />
        )}

        {/* Name / rename input */}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameCommit}
            onClick={(e) => e.stopPropagation()}
            maxLength={50}
            className="flex-1 bg-[#0A0A0A] border border-[#FF2D2D]/40 rounded px-1.5 py-0.5 text-xs text-[#E8E8E8] focus:outline-none focus:border-[#FF2D2D]/70 min-w-0"
          />
        ) : (
          <span
            className={`flex-1 text-xs font-medium truncate leading-none ${
              isSelected ? "text-[#E8E8E8]" : ""
            }`}
          >
            {folder.name}
          </span>
        )}

        {/* Count badge — only when not hovered and has children */}
        {!isRenaming && !isHovered && (videoCount > 0 || folderCount > 0) && (
          <span className="text-[10px] text-[#444] font-mono flex-shrink-0 mr-1">
            {folder.children.length}
          </span>
        )}

        {/* Action buttons on hover */}
        {isHovered && !isRenaming && (
          <div
            className="flex items-center gap-0.5 flex-shrink-0 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateSubfolder(folder.id);
              }}
              className="w-5 h-5 flex items-center justify-center rounded text-[#666] hover:text-[#F5A623] hover:bg-[#F5A623]/10 transition-colors"
              title="New subfolder"
            >
              <FolderPlus size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
                setRenameValue(folder.name);
              }}
              className="w-5 h-5 flex items-center justify-center rounded text-[#666] hover:text-[#E8E8E8] hover:bg-[#2A2A2A] transition-colors"
              title="Rename"
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-5 h-5 flex items-center justify-center rounded text-[#666] hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Delete folder"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}

        {/* Rename confirm / cancel */}
        {isRenaming && (
          <div
            className="flex items-center gap-0.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleRenameCommit}
              className="w-5 h-5 flex items-center justify-center rounded text-green-400 hover:bg-green-400/10 transition-colors"
            >
              <Check size={10} />
            </button>
            <button
              onClick={() => {
                setRenameValue(folder.name);
                setIsRenaming(false);
              }}
              className="w-5 h-5 flex items-center justify-center rounded text-[#666] hover:text-[#E8E8E8] hover:bg-[#2A2A2A] transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* ── Children ── */}
      {isExpanded && (
        <div className="animate-fade-in">
          {/* Empty folder label */}
          {isEmpty && (
            <div
              style={{ paddingLeft: `${8 + (depth + 1) * 14 + 14}px` }}
              className="py-1.5 text-[10px] text-[#444] font-mono italic"
            >
              empty folder
            </div>
          )}

          {/* Sub-folders — always render as list rows regardless of viewMode */}
          {childFolders.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              onPlay={onPlay}
              onCreateSubfolder={onCreateSubfolder}
              viewMode={viewMode}
            />
          ))}

          {/* Videos — render as tiles in tile mode, rows in tree mode */}
          {childVideos.length > 0 &&
            (viewMode === "tile" ? (
              // ── Tile grid ──
              <div
                className="grid grid-cols-2 gap-2 py-2"
                style={{
                  paddingLeft: `${8 + (depth + 1) * 14}px`,
                  paddingRight: "8px",
                }}
              >
                {childVideos.map((video) => (
                  <VideoTile
                    key={video.id}
                    video={{ ...video, folderName: folder.name }}
                    onPlay={onPlay}
                    onDelete={deleteVideo}
                  />
                ))}
              </div>
            ) : (
              // ── List rows ──
              childVideos.map((video) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  depth={depth + 1}
                  onPlay={onPlay}
                  onDelete={deleteVideo}
                />
              ))
            ))}
        </div>
      )}
    </div>
  );
}

// ─── FolderTree Root ─────────────────────────────────────────────────────────

interface FolderTreeProps {
  onPlay: (url: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  viewMode?: "tree" | "tile";
}

export function FolderTree({
  onPlay,
  onCreateSubfolder,
  viewMode = "tree",
}: FolderTreeProps) {
  const { root, deleteVideo } = useCapsuleStore();

  // Empty library state
  if (root.children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1C1C1C] flex items-center justify-center mb-3">
          <Folder size={22} className="text-[#333]" />
        </div>
        <p className="text-sm text-[#555] font-display mb-1">
          Library is empty
        </p>
        <p className="text-xs text-[#3A3A3A] leading-relaxed">
          Create a folder, then save videos
          <br />
          from any YouTube page
        </p>
      </div>
    );
  }

  // Separate root-level folders and loose videos
  const rootFolders = root.children.filter(
    (c) => c.type === "folder",
  ) as FolderItem[];
  const rootVideos = root.children.filter(
    (c) => c.type === "video",
  ) as VideoItemType[];

  return (
    <div className="space-y-0.5 py-1">
      {/* Root-level folders */}
      {rootFolders.map((child) => (
        <FolderNode
          key={child.id}
          folder={child}
          depth={0}
          onPlay={onPlay}
          onCreateSubfolder={onCreateSubfolder}
          viewMode={viewMode}
        />
      ))}

      {/* Root-level loose videos (not inside any folder) */}
      {rootVideos.length > 0 &&
        (viewMode === "tile" ? (
          <div className="grid grid-cols-2 gap-2 px-2 pt-1">
            {rootVideos.map((child) => (
              <VideoTile
                key={child.id}
                video={{ ...child, folderName: "Library" }}
                onPlay={onPlay}
                onDelete={deleteVideo}
              />
            ))}
          </div>
        ) : (
          rootVideos.map((child) => (
            <VideoItem
              key={child.id}
              video={child}
              depth={0}
              onPlay={onPlay}
              onDelete={deleteVideo}
            />
          ))
        ))}
    </div>
  );
}
