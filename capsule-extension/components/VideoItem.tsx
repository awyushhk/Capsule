import { useState } from 'react';
import { Play, Trash2 } from 'lucide-react';
import type { VideoItem as VideoItemType } from '../types';

interface VideoItemProps {
  video: VideoItemType;
  depth?: number;
  onPlay: (url: string) => void;
  onDelete: (videoId: string) => void;
}

export function VideoItem({ video, depth = 0, onPlay, onDelete }: VideoItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{ paddingLeft: `${12 + depth * 16}px` }}
      className="group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[#1C1C1C] transition-colors relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(video.url)}
    >
      {/* Tree connector line */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l border-[#2A2A2A]"
          style={{ left: `${4 + (depth - 1) * 16}px` }}
        />
      )}

      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-10 h-7 rounded overflow-hidden bg-[#2A2A2A]">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Play size={10} className="text-white fill-white" />
          </div>
        )}
      </div>

      {/* Title */}
      <span
        className="flex-1 text-xs text-[#CCCCCC] truncate leading-tight group-hover:text-[#E8E8E8] transition-colors"
        title={video.title}
      >
        {video.title}
      </span>

      {/* Action buttons — single click delete, no confirm needed */}
      {isHovered && (
        <div className="flex items-center gap-0.5 flex-shrink-0 animate-fade-in">
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(video.url); }}
            className="w-6 h-6 flex items-center justify-center rounded text-[#888] hover:text-[#4FBBF0] hover:bg-[#4FBBF0]/10 transition-colors"
            title="Play"
          >
            <Play size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
            className="w-6 h-6 flex items-center justify-center rounded text-[#888] hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  );
}