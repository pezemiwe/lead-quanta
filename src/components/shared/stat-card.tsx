import { Children, type ReactNode, useState, useEffect } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type StatCardVariant = "default" | "highlight" | "warning" | "danger";
type TrendDir = "up" | "down" | "neutral";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { direction: TrendDir; label: string };
  icon?: ReactNode;
  variant?: StatCardVariant;
  className?: string;
  loading?: boolean;
};

const variantClasses: Record<StatCardVariant, { card: string; icon: string }> =
  {
    default: {
      card: "bg-surface border-border",
      icon: "bg-pale-red text-primary",
    },
    highlight: {
      card: "bg-pale-red border-primary/20",
      icon: "bg-primary text-white",
    },
    warning: {
      card: "bg-amber-50 border-amber-200",
      icon: "bg-amber-100 text-amber-700",
    },
    danger: {
      card: "bg-red-50 border-red-200",
      icon: "bg-red-100 text-red-700",
    },
  };

const trendClasses: Record<TrendDir, string> = {
  up: "text-emerald-600",
  down: "text-red-600",
  neutral: "text-dark-gray/50",
};

const TrendIcon = ({ d }: { d: TrendDir }) =>
  d === "up" ? (
    <TrendingUp className="h-3.5 w-3.5" />
  ) : d === "down" ? (
    <TrendingDown className="h-3.5 w-3.5" />
  ) : (
    <Minus className="h-3.5 w-3.5" />
  );

export const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = "default",
  className,
  loading = false,
}: StatCardProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const showSkeleton = loading || !mounted;
  const { card, icon: iconCls } = variantClasses[variant];
  return (
    <div
      className={cn(
        "flex min-h-[7.5rem] flex-col justify-between rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md",
        card,
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-dark-gray/50">
        {title}
      </p>
      {showSkeleton ? (
        <div className="space-y-2">
          <div className="shimmer-skeleton h-8 w-28 rounded-md" />
          <div className="shimmer-skeleton h-4 w-20 rounded-md" />
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-dark-gray">
              {value}
            </p>
            {icon && (
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  iconCls,
                )}
              >
                {icon}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  trendClasses[trend.direction],
                )}
              >
                <TrendIcon d={trend.direction} /> {trend.label}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-dark-gray/50">{subtitle}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const StatCardGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const count = Children.count(children);
  const gridCols =
    count <= 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : count === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={cn("grid gap-5", gridCols, className)}>{children}</div>
  );
};
