import { useState, useEffect, useRef } from 'react';
import { FolderPlus, X, ChevronDown } from 'lucide-react';
import { useCapsuleStore } from '../store/capsuleStore';
import { getAllFolders } from '../utils/treeHelpers';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultParentId?: string;
}

export function CreateFolderModal({ isOpen, onClose, defaultParentId = 'root' }: CreateFolderModalProps) {
  const { root, createFolder } = useCapsuleStore();
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState(defaultParentId);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allFolders = getAllFolders(root);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setParentId(defaultParentId);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultParentId]);

  const handleCreate = () => {
    if (!folderName.trim()) return;
    createFolder(parentId, folderName.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') onClose();
  };

  const getParentName = () => {
    if (parentId === 'root') return 'Library (root)';
    const found = allFolders.find(({ folder }) => folder.id === parentId);
    return found?.folder.name ?? 'Library';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[300px] bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <FolderPlus size={15} className="text-capsule-folder" />
            <span className="text-sm font-semibold text-[#E8E8E8] font-display">New Folder</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[#888] hover:text-[#E8E8E8] hover:bg-[#2A2A2A] transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Folder Name */}
          <div>
            <label className="block text-xs text-[#888] mb-1.5 font-mono">FOLDER NAME</label>
            <input
              ref={inputRef}
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. AI Research"
              maxLength={50}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#E8E8E8] placeholder-[#444] focus:outline-none focus:border-[#FF2D2D]/50 focus:ring-1 focus:ring-[#FF2D2D]/20 transition-all"
            />
          </div>

          {/* Parent Folder */}
          <div>
            <label className="block text-xs text-[#888] mb-1.5 font-mono">INSIDE</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#E8E8E8] hover:border-[#383838] transition-colors"
              >
                <span className="font-mono text-xs truncate">{getParentName()}</span>
                <ChevronDown
                  size={13}
                  className={`text-[#888] transition-transform flex-shrink-0 ml-2 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg overflow-hidden shadow-xl z-10 max-h-40 overflow-y-auto">
                  {/* Root option */}
                  <button
                    onClick={() => { setParentId('root'); setDropdownOpen(false); }}
                    className={`w-full flex items-center px-3 py-2 text-xs text-left hover:bg-[#2A2A2A] transition-colors font-mono ${parentId === 'root' ? 'text-[#FF2D2D]' : 'text-[#E8E8E8]'}`}
                  >
                    📁 Library (root)
                  </button>
                  {allFolders.map(({ folder, depth }) => (
                    <button
                      key={folder.id}
                      onClick={() => { setParentId(folder.id); setDropdownOpen(false); }}
                      className={`w-full flex items-center px-3 py-2 text-xs text-left hover:bg-[#2A2A2A] transition-colors font-mono ${parentId === folder.id ? 'text-[#FF2D2D]' : 'text-[#E8E8E8]'}`}
                      style={{ paddingLeft: `${12 + depth * 14}px` }}
                    >
                      📁 {folder.name}
                    </button>
                  ))}
                  {allFolders.length === 0 && (
                    <div className="px-3 py-2 text-xs text-[#555] font-mono">No folders yet</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-[#888] hover:text-[#E8E8E8] hover:bg-[#2A2A2A] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!folderName.trim()}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-[#FF2D2D] text-white hover:bg-[#CC2424] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
