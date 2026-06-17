import { Logo } from "..";
import { NAV, sid } from "./helpers";

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface xl:flex">
      {/* Brand top accent strip */}
      <div className="h-0.75 w-full shrink-0 bg-primary" />
      {/* Logo header */}
      <div className="shrink-0 border-b border-border bg-pale-red/30 px-4 py-4">
        <Logo />
      </div>
      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 pt-3">
        {NAV.map((n) => (
          <a
            key={n}
            href={`#${sid(n)}`}
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-dark-gray/60 transition-colors hover:bg-pale-red hover:text-primary"
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-transparent transition-colors group-hover:bg-primary" />
            {n}
          </a>
        ))}
      </nav>
      {/* Footer brand mark */}
      <div className="mt-auto shrink-0 border-t border-border px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dark-gray/30">
          Leadway Holdings Group
        </p>
      </div>
    </aside>
  );
}
