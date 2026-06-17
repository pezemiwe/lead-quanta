import { useState, useRef, useEffect, type ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Filter, ChevronDown } from "lucide-react";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type FilterPopoverProps = {
  children: ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  label?: string;
  active?: boolean;
  closeSignal?: number;
  className?: string;
};

export const FilterPopover = ({
  children,
  onApply,
  onReset,
  label = "Filter",
  active = false,
  closeSignal,
  className,
}: FilterPopoverProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (closeSignal !== undefined) setOpen(false);
  }, [closeSignal]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };
  const handleReset = () => {
    onReset?.();
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3.5 h-9 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45 focus-visible:ring-offset-2",
          active
            ? "border-primary bg-pale-red text-primary"
            : "border-border bg-surface text-dark-gray/70 hover:bg-surface-muted",
        )}
      >
        <Filter className="h-3.5 w-3.5" /> {label}{" "}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[min(320px,calc(100vw-2rem))] min-w-[240px] rounded-xl border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="p-4">{children}</div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-dark-gray/60 hover:text-dark-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-mid-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
