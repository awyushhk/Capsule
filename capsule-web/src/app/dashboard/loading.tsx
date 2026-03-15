export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-panel-border/30 glass-panel">
        <div className="p-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-5 w-24 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 px-4 space-y-4 py-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 px-8 flex items-center justify-between border-b border-panel-border/30">
          <div className="h-5 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="flex gap-4">
            <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </header>

        <div className="flex-1 p-8 space-y-12">
          <section>
            <div className="h-4 w-32 bg-white/5 rounded-md mb-6 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          </section>

          <section>
            <div className="h-4 w-32 bg-white/5 rounded-md mb-6 animate-pulse" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
