import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { usePersona } from "../../context/persona";

export interface ModuleNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  group: string;
}

interface ModuleShellProps {
  /** Module display name shown in the header (e.g. "Performance Analytics"). */
  moduleLabel: string;
  /** Optional badge text shown next to the module label (e.g. "Live"). */
  badge?: string;
  /** Base route for child pages, no trailing slash (e.g. "/performance"). */
  basePath: string;
  /** Currently active page id. */
  activePage: string;
  /** Sidebar navigation entries. */
  nav: ModuleNavItem[];
  /** Mapping from group key -> human-readable label. */
  groups: Record<string, string>;
  children: ReactNode;
}

/** Standard chrome (header + grouped sidebar + content area) used by
 *  every feature module. Keeps the look consistent across modules. */
export function ModuleShell({
  moduleLabel,
  badge,
  basePath,
  activePage,
  nav,
  groups,
  children,
}: ModuleShellProps) {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [activePage]);

  // Close sidebar on wide screens if it was toggled open
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const grouped = Object.entries(groups).map(([key, label]) => ({
    groupLabel: label,
    items: nav.filter((n) => n.group === key),
  }));

  const SidebarContent = () => (
    <nav className="flex-1 py-4">
      {grouped.map(({ groupLabel, items }) => (
        <div key={groupLabel} className="mb-5">
          <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-widest text-gray-300">
            {groupLabel}
          </p>
          {items.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`${basePath}/${item.id}`)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-r-2 border-primary bg-pale-red font-medium text-primary"
                    : "text-gray-500 hover:bg-gray-50 hover:text-dark-gray"
                }`}
              >
                <span className={`shrink-0 ${active ? "text-primary" : ""}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen flex-col bg-surface-muted font-sans text-dark-gray overflow-hidden">
      {/* ── Header ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:px-5 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-gray/60 hover:bg-surface-muted md:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Logo collapsed />
          <div className="h-4 w-px bg-border" />
          <span className="max-w-[160px] truncate text-xs font-semibold text-dark-gray sm:max-w-none">
            {moduleLabel}
          </span>
          {badge && (
            <span className="hidden rounded-full bg-pale-red px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline">
              {badge}
            </span>
          )}
        </div>
        <UserMenu
          persona={persona}
          onSwitchModules={() => navigate("/modules")}
          onLogout={() => {
            setPersona({ name: "", role: "", avatar: "" });
            navigate("/");
          }}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-dark-gray/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface overflow-y-auto
            transition-transform duration-200 ease-in-out
            md:static md:w-56 md:translate-x-0 md:z-auto md:shrink-0
            ${sidebarOpen ? "translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.12)]" : "-translate-x-full"}
          `}
        >
          {/* Mobile close button */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
            <span className="text-sm font-semibold text-dark-gray">
              {moduleLabel}
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-dark-gray/50 hover:bg-surface-muted"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
