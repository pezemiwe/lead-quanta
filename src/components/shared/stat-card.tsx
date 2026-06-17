import { type ReactNode, useState, useEffect } from "react";
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
    const t = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(t);
  }, []);

  const showSkeleton = loading || !mounted;
  const { card, icon: iconCls } = variantClasses[variant];
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]",
        card,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-dark-gray/65">{title}</p>
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              iconCls,
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {showSkeleton ? (
        <div className="space-y-2">
          <div className="shimmer-skeleton h-8 w-28 rounded-md" />
          <div className="shimmer-skeleton h-4 w-20 rounded-md" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-semibold tracking-tight text-dark-gray">
            {value}
          </p>
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
}) => (
  <div
    className={cn(
      "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
      className,
    )}
  >
    {children}
  </div>
);
