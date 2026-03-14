import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Bookmark, Folder, Monitor, Search, ArrowRight, Github } from 'lucide-react';

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-accent/30 overflow-x-hidden">
      
      {/* ── Background Effects ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-panel px-4 py-2.5 rounded-2xl border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
              <Bookmark size={18} className="text-white fill-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Capsule</span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {!userId ? (
              <>
                <Link 
                  href="/sign-in" 
                  className="hidden sm:block text-xs font-semibold text-muted hover:text-white transition-all px-4 py-2 rounded-xl hover:bg-white/5"
                >
                  Sign in
                </Link>
                <Link 
                  href="/sign-up" 
                  className="text-xs font-bold bg-white text-black hover:bg-white/90 px-4 md:px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-white/5"
                >
                  Get started
                </Link>
              </>
            ) : (
              <Link 
                href="/dashboard" 
                className="text-xs font-bold bg-accent hover:bg-accent-hover text-white px-4 md:px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-accent/20 border border-white/10"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative z-10 pt-32 md:pt-48 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          Easy Video Saving
        </div>

        <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight animate-fade-in-up leading-[1.1]">
          Your YouTube Library,<br />
          <span className="bg-gradient-to-r from-accent to-amber-500 bg-clip-text text-transparent">Perfectly Organized.</span>
        </h1>

        <p className="text-base md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up [animation-delay:200ms]">
          Save YouTube videos into nested folders from the Chrome extension.
          Access your entire library from any device on the web.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up [animation-delay:400ms]">
          {!userId ? (
            <Link 
              href="/sign-up" 
              className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group transition-all shadow-xl shadow-accent/20"
            >
              Start Saving for Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group transition-all shadow-xl shadow-accent/20"
            >
              Open Your Library <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          <a 
            href="https://github.com/awyushhk/Capsule" 
            target="_blank" 
            rel="noreferrer"
            className="w-full sm:w-auto glass-panel px-8 py-4 rounded-2xl font-bold text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <Github size={18} /> View on GitHub
          </a>
        </div>
      </section>

      {/* ── Feature Grid ──────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              icon: Folder, 
              title: 'Nested Folders', 
              desc: 'Organize videos into unlimited nested folders like a file system.',
              color: 'text-blue-400',
              bg: 'bg-blue-400/10'
            },
            { 
              icon: Monitor, 
              title: 'Watch Anywhere', 
              desc: 'Access your library from Chrome extension, web, or mobile browser.',
              color: 'text-accent',
              bg: 'bg-accent/10'
            },
            { 
              icon: Search, 
              title: 'Instant Search', 
              desc: 'Find any saved video instantly by title or folder name.',
              color: 'text-amber-400',
              bg: 'bg-amber-400/10'
            },
          ].map(({ icon: Icon, title, desc, color, bg }, idx) => (
            <div 
              key={title} 
              className="glass-panel group p-8 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
              style={{ animationDelay: `${600 + idx * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon size={22} className={color} />
              </div>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-sm text-muted leading-relaxed font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Bookmark size={16} className="text-white fill-white" />
            <span className="text-sm font-bold tracking-tight">Capsule</span>
          </div>
          <p className="text-xs text-muted font-medium">© 2026 Capsule. Made with ❤️ by Ayush.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs text-muted hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-xs text-muted hover:text-white transition-colors">Help</a>
          </div>
        </div>
      </footer>

    </div>
  );
}