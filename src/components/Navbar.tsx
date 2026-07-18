export default function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600 text-sm font-bold text-white">
              G
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">
                GlyphLab
              </h1>
              <p className="text-xs text-zinc-500">
                Transform Images into ASCII Art
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
