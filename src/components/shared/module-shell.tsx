import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { ReconciliationNotifications } from "./reconciliation-notifications";
import { NotificationBell } from "./notification-bell";
import { FmdqTicker } from "./fmdq-ticker";
import { usePersona } from "../../context/persona";
import { useEntity, type EntityId } from "../../context/entity";

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

function EntitySelector() {
  const { entity, setEntityId, entities } = useEntity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-dark-gray/70 transition hover:bg-pale-red hover:text-primary"
        style={{ borderColor: entity.colour + "33" }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: entity.colour }}
        />
        {entity.shortName}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-dark-gray/40">
              Select Entity
            </p>
          </div>
          {entities.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setEntityId(e.id as EntityId);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-muted ${
                entity.id === e.id ? "bg-pale-red" : ""
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: e.colour }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-dark-gray truncate">
                  {e.shortName}
                  {entity.id === e.id && (
                    <span className="ml-1.5 text-[9px] text-primary">✓</span>
                  )}
                </p>
                <p className="text-[10px] text-dark-gray/45 truncate">
                  {e.regulator} · {e.name.split("—")[0].trim()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
      {/* ── FMDQ Live Rate Ticker ── */}
      <FmdqTicker />
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
          <span className="max-w-40 truncate text-xs font-semibold text-dark-gray sm:max-w-none">
            {moduleLabel}
          </span>
          {badge && (
            <span className="hidden rounded-full bg-pale-red px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline">
              {badge}
            </span>
          )}
          <EntitySelector />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <ReconciliationNotifications />
          <UserMenu
            persona={persona}
            onSwitchModules={() => navigate("/modules")}
            onLogout={() => {
              setPersona({ name: "", role: "", avatar: "" });
              navigate("/");
            }}
          />
        </div>
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
