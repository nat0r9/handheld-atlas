const navItems = ["Games", "Handhelds", "Presets", "Benchmarks", "Compare", "Guides"];

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="text-xl font-black tracking-tight text-white">
          HandheldAtlas
        </div>

        <div className="hidden gap-6 text-sm text-slate-400 md:flex">
          {navItems.map((item) => (
            <a key={item} href="#" className="hover:text-white">
              {item}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}