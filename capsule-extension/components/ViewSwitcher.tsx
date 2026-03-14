import { List, LayoutGrid } from 'lucide-react';
import type { ViewMode } from '../types';

interface ViewSwitcherProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ mode, onModeChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center bg-[#0A0A0A] rounded-lg p-0.5 border border-[#2A2A2A]">
      <button
        onClick={() => onModeChange('tree')}
        title="Tree View"
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
          mode === 'tree'
            ? 'bg-[#FF2D2D] text-white shadow-sm shadow-[#FF2D2D]/30'
            : 'text-[#666] hover:text-[#E8E8E8] hover:bg-[#1C1C1C]'
        }`}
      >
        <List size={13} />
      </button>
      <button
        onClick={() => onModeChange('tile')}
        title="Tile View"
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
          mode === 'tile'
            ? 'bg-[#FF2D2D] text-white shadow-sm shadow-[#FF2D2D]/30'
            : 'text-[#666] hover:text-[#E8E8E8] hover:bg-[#1C1C1C]'
        }`}
      >
        <LayoutGrid size={13} />
      </button>
    </div>
  );
}
