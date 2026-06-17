import { type ReactNode, useId } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type TabItem<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
  icon?: ReactNode;
};

type TabsVariant = "underline" | "pill";
type TabsSize = "sm" | "md" | "lg";

type TabsProps<T extends string = string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
};

const sizeClasses: Record<TabsSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export const Tabs = <T extends string>({
  tabs,
  value,
  onChange,
  variant = "underline",
  size = "md",
  className,
}: TabsProps<T>) => {
  const baseId = useId();

  if (variant === "pill") {
    return (
      <div
        role="tablist"
        className={cn(
          "flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1",
          className,
        )}
      >
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              id={`${baseId}-${tab.value}`}
              role="tab"
              aria-selected={active}
              type="button"
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45 focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                sizeClasses[size],
                active
                  ? "bg-surface text-primary shadow-sm ring-1 ring-border"
                  : "text-dark-gray/60 hover:text-dark-gray",
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "min-w-4.5 rounded-full px-1 text-center text-[10px] font-semibold leading-5",
                    active
                      ? "bg-pale-red text-primary"
                      : "bg-light-gray text-dark-gray/60",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-0 overflow-x-auto border-b border-border",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            id={`${baseId}-${tab.value}`}
            role="tab"
            aria-selected={active}
            type="button"
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 font-medium whitespace-nowrap transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45 focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              sizeClasses[size],
              active
                ? "border-primary text-primary"
                : "border-transparent text-dark-gray/55 hover:border-border hover:text-dark-gray",
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "min-w-4.5 rounded-full px-1 text-center text-[10px] font-semibold leading-5",
                  active
                    ? "bg-pale-red text-primary"
                    : "bg-light-gray text-dark-gray/55",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
