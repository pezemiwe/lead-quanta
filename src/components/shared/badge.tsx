import React from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type BadgeVariant =
  | "performing"
  | "watch"
  | "substandard"
  | "doubtful"
  | "loss"
  | "active"
  | "default"
  | "written-off"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "brand"
  | "info";

export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  label?: string;
  children?: React.ReactNode;
  dot?: boolean;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  performing: "bg-emerald-50 text-emerald-800 border-emerald-200",
  watch: "bg-sky-50 text-sky-800 border-sky-200",
  substandard: "bg-amber-50 text-amber-800 border-amber-200",
  doubtful: "bg-orange-50 text-orange-800 border-orange-200",
  loss: "bg-red-50 text-red-800 border-red-200",
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  default: "bg-red-50 text-red-800 border-red-200",
  "written-off": "bg-slate-100 text-slate-600 border-slate-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
  brand: "bg-pale-red text-deep-red border-primary/20",
  info: "bg-sky-50 text-sky-800 border-sky-200",
};

const dotClasses: Record<BadgeVariant, string> = {
  performing: "bg-emerald-500",
  watch: "bg-sky-500",
  substandard: "bg-amber-500",
  doubtful: "bg-orange-500",
  loss: "bg-red-600",
  active: "bg-emerald-500",
  default: "bg-red-600",
  "written-off": "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-600",
  neutral: "bg-slate-400",
  brand: "bg-primary",
  info: "bg-sky-500",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px] leading-4",
  md: "px-2 py-0.5 text-xs leading-5",
  lg: "px-2.5 py-1 text-xs leading-5",
};

export const Badge = ({
  variant = "neutral",
  size = "md",
  label,
  children,
  dot = false,
  className,
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      variantClasses[variant],
      sizeClasses[size],
      className,
    )}
  >
    {dot && (
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClasses[variant])}
      />
    )}
    {children ?? label}
  </span>
);

export const ClassificationBadge = ({
  classification,
  ...props
}: Omit<BadgeProps, "variant" | "label" | "children"> & {
  classification: "AC" | "FVOCI" | "FVTPL";
}) => {
  const map: Record<"AC" | "FVOCI" | "FVTPL", BadgeVariant> = {
    AC: "success",
    FVOCI: "warning",
    FVTPL: "info",
  };
  return (
    <Badge variant={map[classification]} label={classification} dot {...props} />
  );
};
