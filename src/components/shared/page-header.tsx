import type { ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
};

export const PageHeader = ({
  title,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) => (
  <div
    className={cn(
      "flex flex-wrap items-start justify-between gap-4 pb-6",
      className,
    )}
  >
    <div className="min-w-0">
      {eyebrow && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-xl font-semibold tracking-tight text-dark-gray">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-dark-gray/60">{description}</p>
      )}
    </div>
    {actions && (
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {actions}
      </div>
    )}
  </div>
);
