import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type InputSize = "sm" | "md" | "lg";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  label?: string;
  hint?: string;
  error?: string;
  labelClassName?: string;
  containerClassName?: string;
  icon?: ReactNode;
  endAdornment?: ReactNode;
};

const sizeClasses: Record<InputSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const iconPaddingLeft: Record<InputSize, string> = {
  sm: "pl-8",
  md: "pl-10",
  lg: "pl-11",
};

const iconSizeClasses: Record<InputSize, string> = {
  sm: "left-2.5 h-3.5 w-3.5",
  md: "left-3 h-4 w-4",
  lg: "left-3.5 h-5 w-5",
};

export const Input = ({
  className,
  type = "text",
  size = "md",
  label,
  hint,
  error,
  labelClassName,
  containerClassName,
  icon,
  endAdornment,
  id,
  ...props
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasError = !!error;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn("text-sm font-medium text-dark-gray", labelClassName)}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-dark-gray/50",
              iconSizeClasses[size],
            )}
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={cn(
            "w-full rounded-lg border bg-surface text-dark-gray",
            "outline-none transition-all duration-200",
            "placeholder:text-dark-gray/40",
            hasError
              ? "border-danger ring-danger/20 focus:border-danger focus:ring-2"
              : "border-border hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-focus/20",
            "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
            sizeClasses[size],
            icon && iconPaddingLeft[size],
            endAdornment && "pr-10",
            className,
          )}
          {...props}
        />
        {endAdornment && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {endAdornment}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-dark-gray/55">
          {hint}
        </p>
      )}
    </div>
  );
};
