import type { ButtonHTMLAttributes } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "solid"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-white hover:border-mid-red hover:bg-mid-red active:bg-deep-red",
  secondary:
    "border-border bg-pale-red text-deep-red hover:border-primary/35 hover:bg-primary/10 active:bg-primary/15",
  outline:
    "border-primary/60 bg-transparent text-deep-red hover:border-primary hover:bg-primary/8",
  ghost:
    "border-transparent bg-transparent text-dark-gray hover:bg-pale-red hover:text-dark-gray",
  solid:
    "border-deep-red bg-deep-red text-white hover:border-mid-red hover:bg-mid-red active:bg-deep-red",
  danger:
    "border-red-700 bg-red-700 text-white hover:border-red-800 hover:bg-red-800 active:bg-red-900",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2.5",
};

const SpinnerIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 animate-spin fill-current opacity-70"
    viewBox="0 0 100 101"
    fill="none"
  >
    <path
      d="M100 50.591C100 78.205 77.614 100.591 50 100.591C22.386 100.591 0 78.205 0 50.591C0 22.977 22.386 0.591 50 0.591C77.614 0.591 100 22.977 100 50.591ZM9.081 50.591C9.081 73.19 27.401 91.509 50 91.509C72.599 91.509 90.919 73.19 90.919 50.591C90.919 27.992 72.599 9.672 50 9.672C27.401 9.672 9.081 27.992 9.081 50.591Z"
      fill="currentColor"
      opacity=".25"
    />
    <path
      d="M93.968 39.041C96.393 38.404 97.862 35.912 97.008 33.554C95.293 28.823 92.871 24.369 89.817 20.348C85.845 15.119 80.883 10.724 75.212 7.413C69.542 4.102 63.275 1.94 56.77 1.051C51.767 0.368 46.698 0.447 41.735 1.279C39.261 1.693 37.813 4.198 38.45 6.623C39.087 9.049 41.569 10.472 44.051 10.107C47.851 9.549 51.719 9.527 55.54 10.049C60.864 10.777 65.993 12.546 70.633 15.255C75.274 17.965 79.335 21.562 82.585 25.841C84.918 28.912 86.8 32.291 88.181 35.876C89.083 38.216 91.542 39.678 93.968 39.041Z"
      fill="currentColor"
    />
  </svg>
);

export const Button = ({
  className,
  loading,
  children,
  leftIcon,
  rightIcon,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-lg border font-medium",
        "transition-all duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-white",
        "disabled:pointer-events-none disabled:opacity-55",
        "active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? <SpinnerIcon /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
};
