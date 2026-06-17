import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type DrawerSize = "sm" | "md" | "lg";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DrawerSize;
};

const sizeClasses: Record<DrawerSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DrawerProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "drawer-title" : undefined}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-dark-gray/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* On mobile: full-screen. On sm+: right-side panel */}
      <div
        className={`relative z-10 flex h-full w-full flex-col border-l border-border bg-surface shadow-[-12px_0_40px_-12px_rgba(0,0,0,0.18)] ${sizeClasses[size]} animate-slide-in-right`}
      >
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-5">
            <div>
              {title && (
                <h2
                  id="drawer-title"
                  className="text-base font-semibold text-dark-gray"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-dark-gray/60">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dark-gray/50 transition-colors hover:bg-pale-red hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-surface-muted px-4 py-3 sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
