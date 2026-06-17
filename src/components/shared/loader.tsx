import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<LoaderSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

type LoaderProps = {
  size?: LoaderSize;
  className?: string;
  label?: string;
};

export const Loader = ({ size = "md", className, label }: LoaderProps) => (
  <div
    role="status"
    className={cn("inline-flex flex-col items-center gap-2", className)}
  >
    <svg
      aria-hidden="true"
      className={cn("animate-spin", sizeMap[size])}
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.591C100 78.205 77.614 100.591 50 100.591C22.386 100.591 0 78.205 0 50.591C0 22.977 22.386 0.591 50 0.591C77.614 0.591 100 22.977 100 50.591ZM9.081 50.591C9.081 73.19 27.401 91.509 50 91.509C72.599 91.509 90.919 73.19 90.919 50.591C90.919 27.992 72.599 9.672 50 9.672C27.401 9.672 9.081 27.992 9.081 50.591Z"
        fill="#E2E2E2"
      />
      <path
        d="M93.968 39.041C96.393 38.404 97.862 35.912 97.008 33.554C95.293 28.823 92.871 24.369 89.817 20.348C85.845 15.119 80.883 10.724 75.212 7.413C69.542 4.102 63.275 1.94 56.77 1.051C51.767 0.368 46.698 0.447 41.735 1.279C39.261 1.693 37.813 4.198 38.45 6.623C39.087 9.049 41.569 10.472 44.051 10.107C47.851 9.549 51.719 9.527 55.54 10.049C60.864 10.777 65.993 12.546 70.633 15.255C75.274 17.965 79.335 21.562 82.585 25.841C84.918 28.912 86.8 32.291 88.181 35.876C89.083 38.216 91.542 39.678 93.968 39.041Z"
        fill="#F7941D"
      />
    </svg>
    {label && <span className="sr-only">{label}</span>}
  </div>
);

/** Full-page centered loader overlay */
export const PageLoader = ({ label = "Loading…" }: { label?: string }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
    <Loader size="lg" />
    <p className="text-sm text-dark-gray/70">{label}</p>
  </div>
);

/** Inline row skeleton for table cells */
export const SkeletonRow = ({ cols = 4 }: { cols?: number }) => (
  <div className="flex items-center gap-4 px-4 py-3">
    {Array.from({ length: cols }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "shimmer-skeleton h-4 rounded",
          i === 0 ? "w-32" : "flex-1",
        )}
      />
    ))}
  </div>
);

/** Generic skeleton block */
export const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("shimmer-skeleton rounded-lg", className)} {...props} />
);
