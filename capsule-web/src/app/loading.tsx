'use client';

import { Bookmark } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center gap-6">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px] animate-pulse" />
      
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-2xl shadow-accent/40 animate-bounce">
          <Bookmark size={32} className="text-white fill-white" />
        </div>
        {/* Spinner Ring */}
        <div className="absolute -inset-4 border-2 border-accent/20 border-t-accent rounded-[2rem] animate-spin" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-white animate-pulse">Initializing Capsule</h2>
        <p className="text-sm text-muted font-medium">Securing your library...</p>
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-accent w-1/3 animate-[loading_2s_ease-in-out_infinite]" />
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
