import { type ReactNode, useState, useEffect } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
  loading?: boolean;
};

export const SectionCard = ({
  title,
  description,
  actions,
  children,
  noPadding = false,
  className,
  loading = false,
}: SectionCardProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(t);
  }, []);

  const showSkeleton = loading || !mounted;
  const hasHeader = !!(title || description || actions);
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {showSkeleton ? (
              <>
                <div className="shimmer-skeleton h-4 w-40 rounded-md" />
                {description !== undefined && (
                  <div className="mt-1.5 shimmer-skeleton h-3 w-56 rounded-md" />
                )}
              </>
            ) : (
              <>
                {title && (
                  <h3 className="text-sm font-semibold text-dark-gray">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-0.5 text-xs text-dark-gray/55">
                    {description}
                  </p>
                )}
              </>
            )}
          </div>
          {actions && !showSkeleton && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>
        {showSkeleton ? (
          <div className="space-y-3">
            <div className="shimmer-skeleton h-4 w-full rounded-md" />
            <div className="shimmer-skeleton h-4 w-5/6 rounded-md" />
            <div className="shimmer-skeleton h-4 w-4/6 rounded-md" />
            <div className="mt-2 shimmer-skeleton h-4 w-full rounded-md" />
            <div className="shimmer-skeleton h-4 w-3/4 rounded-md" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
