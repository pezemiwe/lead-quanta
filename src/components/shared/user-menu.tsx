import { useState, useRef, useEffect } from "react";
import { LogOut, LayoutGrid } from "lucide-react";

interface UserMenuProps {
  persona: { name: string; role: string; avatar: string };
  onSwitchModules: () => void;
  onLogout: () => void;
}

export function UserMenu({
  persona,
  onSwitchModules,
  onLogout,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const firstNamePart = persona.name.split(" ")[0] || "U";
  const initials = persona.avatar || firstNamePart.slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </div>
        <div className="hidden sm:block leading-tight text-left">
          <p className="text-xs font-semibold text-dark-gray">
            {persona.name || "User"}
          </p>
          <p className="text-xs text-gray-400">{persona.role || ""}</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-white py-1 shadow-lg z-50">
          <button
            onClick={() => {
              setIsOpen(false);
              onSwitchModules();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-dark-gray hover:bg-gray-50 transition-colors"
          >
            <LayoutGrid className="h-4 w-4 text-gray-400" />
            Switch Modules
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-dark-gray hover:bg-pale-red hover:text-primary transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
