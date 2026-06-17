import type { ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileX2, FolderOpen, SearchX, DatabaseZap } from "lucide-react";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type Preset = "no-data" | "no-results" | "no-files" | "not-run";
const presetIcons: Record<Preset, ReactNode> = {
  "no-data": <DatabaseZap className="h-9 w-9" />,
  "no-results": <SearchX className="h-9 w-9" />,
  "no-files": <FileX2 className="h-9 w-9" />,
  "not-run": <FolderOpen className="h-9 w-9" />,
};

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  preset?: Preset;
  compact?: boolean;
  className?: string;
};

export const EmptyState = ({
  title,
  description,
  action,
  icon,
  preset,
  compact = false,
  className,
}: EmptyStateProps) => {
  const displayIcon =
    icon ??
    (preset ? presetIcons[preset] : <DatabaseZap className="h-9 w-9" />);
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 py-8 px-4" : "gap-4 py-16 px-6",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400",
          compact ? "h-12 w-12" : "h-16 w-16",
        )}
        aria-hidden="true"
      >
        {displayIcon}
      </span>
      <div className={cn("max-w-xs", compact && "max-w-55")}>
        <p
          className={cn(
            "font-semibold text-dark-gray",
            compact ? "text-sm" : "text-base",
          )}
        >
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "mt-1 text-dark-gray/55",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
