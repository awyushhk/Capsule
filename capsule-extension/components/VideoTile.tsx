import { useState } from 'react';
import { Play, Trash2, Folder } from 'lucide-react';
import type { VideoItem } from '../types';

interface VideoTileProps {
  video: VideoItem & { folderName: string };
  onPlay: (url: string) => void;
  onDelete: (videoId: string) => void;
}

export function VideoTile({ video, onPlay, onDelete }: VideoTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formattedDate = new Date(video.dateSaved).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="group relative bg-[#141414] rounded-xl border border-[#1E1E1E] hover:border-[#2A2A2A] overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(video.url)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#1C1C1C] overflow-hidden">
        {!imgError ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={20} className="text-[#444]" />
          </div>
        )}

        {/* Play overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-full bg-[#FF2D2D] flex items-center justify-center shadow-lg shadow-[#FF2D2D]/30">
            <Play size={14} className="text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Delete button — single click, instant */}
        {isHovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white/80 hover:bg-red-500 hover:text-white transition-all duration-150 animate-fade-in"
            title="Remove"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3
          className="text-xs font-medium text-[#E8E8E8] leading-snug line-clamp-2 mb-1.5"
          title={video.title}
        >
          {video.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <Folder size={10} className="text-[#F5A623] flex-shrink-0" />
            <span className="text-[10px] text-[#666] font-mono truncate">{video.folderName}</span>
          </div>
          <span className="text-[10px] text-[#444] flex-shrink-0">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}