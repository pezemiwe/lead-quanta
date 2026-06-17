import { useId, type SelectHTMLAttributes } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { InputSize } from "./input";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type SelectOption = { label: string; value: string; disabled?: boolean };

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  options?: SelectOption[];
  size?: InputSize;
  label?: string;
  hint?: string;
  error?: string;
  labelClassName?: string;
  containerClassName?: string;
  placeholder?: string;
};

const sizeClasses: Record<InputSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Select = ({
  className,
  options,
  children,
  size = "md",
  label,
  hint,
  error,
  labelClassName,
  containerClassName,
  placeholder,
  id,
  ...props
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hasError = !!error;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn("text-sm font-medium text-dark-gray", labelClassName)}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={hasError}
        className={cn(
          "w-full appearance-none rounded-lg border bg-surface text-dark-gray",
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_0.75rem_center] bg-no-repeat pr-9",
          "outline-none transition-all duration-200",
          hasError
            ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
            : "border-border hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-focus/20",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-dark-gray/55">{hint}</p>}
    </div>
  );
};
