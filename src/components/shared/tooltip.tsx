import { useState, useRef, useEffect, type ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type Placement = "top" | "bottom" | "left" | "right";
const placementMap: Record<Placement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

type TooltipProps = {
  content: ReactNode;
  placement?: Placement;
  children: ReactNode;
  delay?: number;
  className?: string;
};

export const Tooltip = ({
  content,
  placement = "top",
  children,
  delay = 400,
  className,
}: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const show = () => {
    timer.current = window.setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setVisible(false);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-dark-gray px-3 py-1.5 text-xs font-medium text-white shadow-lg",
            placementMap[placement],
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
};
