import { type ReactNode, useState, useEffect } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "./empty-state";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: ReactNode;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor?: (row: T, i: number) => string | number;
  emptyMessage?: string;
  emptyDescription?: string;
  loading?: boolean;
  striped?: boolean;
  className?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
};

export const DataTable = <T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor = (_row: T, i: number) => i,
  emptyMessage = "No data",
  emptyDescription,
  loading = false,
  striped = true,
  className,
  pageSize,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) => {
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(t);
  }, []);

  const showSkeleton = loading || !mounted;

  // Reset to page 1 when data changes
  useEffect(() => {
    setPage(1);
  }, [data.length]);

  const totalPages = pageSize
    ? Math.max(1, Math.ceil(data.length / pageSize))
    : 1;
  const pagedData = pageSize
    ? data.slice((page - 1) * pageSize, page * pageSize)
    : data;

  const alignCls = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const from = pageSize ? (page - 1) * pageSize + 1 : 1;
  const to = pageSize ? Math.min(page * pageSize, data.length) : data.length;

  // Build visible page numbers (always show first, last, current ±1)
  function pageNumbers() {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [];
    const near = new Set(
      [1, totalPages, page - 1, page, page + 1].filter(
        (p) => p >= 1 && p <= totalPages,
      ),
    );
    let prev = 0;
    for (const p of Array.from(near).sort((a, b) => a - b)) {
      if (p - prev > 1) pages.push("…");
      pages.push(p);
      prev = p;
    }
    return pages;
  }

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-border",
        className,
      )}
    >
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  "border-b border-border bg-deep-red px-2 py-2.5 sm:px-4 sm:py-3 text-xs font-semibold uppercase tracking-wide text-white first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap",
                  alignCls[col.align ?? "left"],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {showSkeleton ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={columns.length} className="px-4 py-3">
                  <div className="shimmer-skeleton h-5 rounded-md" />
                </td>
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  preset="no-data"
                  title={emptyMessage}
                  description={emptyDescription}
                  compact
                />
              </td>
            </tr>
          ) : (
            pagedData.map((row, i) => (
              <tr
                key={keyExtractor(row, (page - 1) * (pageSize ?? 0) + i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border last:border-0 transition-colors hover:bg-pale-red/40",
                  striped && i % 2 !== 0 && "bg-[#F8F8F8]",
                  onRowClick && "cursor-pointer",
                  rowClassName?.(row),
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      "px-2 py-2.5 sm:px-4 sm:py-3 text-dark-gray/80 whitespace-nowrap",
                      alignCls[col.align ?? "left"],
                    )}
                  >
                    {col.render
                      ? col.render(row, (page - 1) * (pageSize ?? 0) + i)
                      : (row[col.key as keyof T] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination footer */}
      {pageSize && data.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-[#FAFAFA] px-3 py-2 sm:px-4 sm:py-2.5">
          <span className="text-xs text-dark-gray/50">
            <span className="hidden sm:inline">Showing </span>
            <span className="font-medium text-dark-gray/70">
              {from}–{to}
            </span>{" "}
            of{" "}
            <span className="font-medium text-dark-gray/70">{data.length}</span>
            <span className="hidden sm:inline"> records</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white text-dark-gray/60 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {pageNumbers().map((p, i) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-xs text-dark-gray/40"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={cn(
                    "flex h-7 min-w-[28px] items-center justify-center rounded-md border px-1.5 text-xs font-medium transition-colors",
                    page === p
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-dark-gray/70 hover:border-primary hover:text-primary",
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white text-dark-gray/60 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
