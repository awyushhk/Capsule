import { useState } from 'react';
import { Save, Folder, Check, ChevronDown, AlertCircle } from 'lucide-react';
import { useCapsuleStore } from '../store/capsuleStore';
import { getAllFolders, videoExistsInTree, videoExistsInFolder } from '../utils/treeHelpers';

interface SaveVideoPanelProps {
  onClose: () => void;
}

export function SaveVideoPanel({ onClose }: SaveVideoPanelProps) {
  const { root, currentVideo, addVideo } = useCapsuleStore();
  const [selectedFolderId, setSelectedFolderId] = useState('root');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const allFolders = getAllFolders(root);
  // True if saved anywhere (informational only — doesn't block saving)
  const savedSomewhere = currentVideo ? videoExistsInTree(root, currentVideo.videoId) : false;
  // True only if the selected folder already has this video (blocks saving)
  const alreadyInFolder = currentVideo
    ? videoExistsInFolder(root, selectedFolderId, currentVideo.videoId)
    : false;

  const getFolderName = (id: string) => {
    if (id === 'root') return 'Library (root)';
    return allFolders.find(({ folder }) => folder.id === id)?.folder.name ?? 'Library';
  };

  const handleSave = () => {
    if (!currentVideo || alreadyInFolder) return;
    addVideo(selectedFolderId, {
      videoId: currentVideo.videoId,
      title: currentVideo.title,
      thumbnail: currentVideo.thumbnail,
      url: currentVideo.url,
    });
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  const handleSelectFolder = (id: string) => {
    setSelectedFolderId(id);
    setDropdownOpen(false);
  };

  if (!currentVideo) {
    return (
      <div className="mx-3 mb-3 p-3 rounded-xl bg-[#141414] border border-[#2A2A2A]">
        <div className="flex items-center gap-2 text-[#555]">
          <AlertCircle size={13} />
          <span className="text-xs font-mono">No video detected on this page</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 rounded-xl bg-[#141414] border border-[#2A2A2A] animate-scale-in">

      {/* Video preview */}
      <div className="flex items-center gap-2.5 p-3 border-b border-[#1E1E1E]">
        <img
          src={currentVideo.thumbnail}
          alt={currentVideo.title}
          className="w-14 h-10 rounded-lg object-cover bg-[#1C1C1C] flex-shrink-0"
          onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0')}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#E8E8E8] leading-snug line-clamp-2">
            {currentVideo.title}
          </p>
          {savedSomewhere && (
            <p className="text-[10px] text-green-400 flex items-center gap-1 mt-0.5">
              <Check size={9} /> Saved in a folder
            </p>
          )}
        </div>
      </div>

      {/* Folder selector — always shown so user can pick any folder */}
      <div className="p-3 space-y-2.5">

          {/* Trigger button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-[#0A0A0A] border border-[#2A2A2A] hover:border-[#383838] rounded-lg px-2.5 py-2 text-xs transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Folder size={11} className="text-[#F5A623] flex-shrink-0" />
              <span className="text-[#E8E8E8] font-mono truncate">{getFolderName(selectedFolderId)}</span>
            </div>
            <ChevronDown
              size={11}
              className={`text-[#666] flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Inline expanding folder list */}
          {dropdownOpen && (
            <div
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg"
              style={{ maxHeight: '180px', overflowY: 'auto' }}
            >
              {/* Root option */}
              <button
                onClick={() => handleSelectFolder('root')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-[#252525] transition-colors font-mono border-b border-[#222] ${
                  selectedFolderId === 'root' ? 'text-[#FF2D2D]' : 'text-[#E8E8E8]'
                }`}
              >
                <Folder size={11} className="text-[#F5A623] flex-shrink-0" />
                Library (root)
                {selectedFolderId === 'root' && <Check size={10} className="ml-auto text-[#FF2D2D]" />}
              </button>

              {/* All nested folders */}
              {allFolders.map(({ folder, depth }) => (
                <button
                  key={folder.id}
                  onClick={() => handleSelectFolder(folder.id)}
                  className={`w-full flex items-center gap-2 py-2.5 text-xs text-left hover:bg-[#252525] transition-colors font-mono ${
                    selectedFolderId === folder.id ? 'text-[#FF2D2D]' : 'text-[#CCCCCC]'
                  }`}
                  style={{ paddingLeft: `${12 + depth * 14}px`, paddingRight: '12px' }}
                >
                  <Folder size={11} className="text-[#F5A623] flex-shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  {selectedFolderId === folder.id && <Check size={10} className="ml-auto flex-shrink-0 text-[#FF2D2D]" />}
                </button>
              ))}

              {allFolders.length === 0 && (
                <p className="px-3 py-3 text-xs text-[#555] font-mono italic">
                  No folders yet — create one first
                </p>
              )}
            </div>
          )}

          {/* Per-folder duplicate warning */}
          {alreadyInFolder && !saved && (
            <p className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
              <AlertCircle size={10} /> Already saved in this folder
            </p>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saved || alreadyInFolder}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : alreadyInFolder
                ? 'bg-[#1C1C1C] text-[#555] border border-[#2A2A2A] cursor-not-allowed'
                : 'bg-[#FF2D2D] hover:bg-[#CC2424] text-white'
            }`}
          >
            {saved ? (
              <><Check size={12} /> Saved!</>
            ) : alreadyInFolder ? (
              <><Check size={12} /> In this folder</>
            ) : (
              <><Save size={12} /> Save to {getFolderName(selectedFolderId)}</>
            )}
          </button>

        </div>
    </div>
  );
}
