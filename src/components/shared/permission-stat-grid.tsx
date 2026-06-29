import { Children, type ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Stat row that sizes columns to the number of visible (permission-gated) cards. */
export function PermissionStatGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const count = Children.count(children);
  if (count === 0) return null;

  const gridCols =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : count === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={cn("grid gap-5", gridCols, className)}>{children}</div>
  );
}
