import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type FileUploadTone = "neutral" | "success" | "error";

type FileUploadLoaderProps = {
  progress: number;
  label?: string;
  fileName?: string;
  tone?: FileUploadTone;
  className?: string;
};

const toneMap: Record<
  FileUploadTone,
  { text: string; track: string; bar: string }
> = {
  neutral: {
    text: "text-dark-gray/70",
    track: "bg-light-gray",
    bar: "bg-primary",
  },
  success: {
    text: "text-success",
    track: "bg-emerald-100",
    bar: "bg-success",
  },
  error: {
    text: "text-danger",
    track: "bg-red-100",
    bar: "bg-danger",
  },
};

export const FileUploadLoader = ({
  progress,
  label,
  fileName,
  tone = "neutral",
  className = "",
}: FileUploadLoaderProps) => {
  const displayLabel = label ?? fileName;
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const c = toneMap[tone];

  return (
    <div className={cn("w-full max-w-56", className)}>
      <div
        className={cn(
          "mb-1 flex justify-between text-[11px] font-medium",
          c.text,
        )}
      >
        <span>{displayLabel ?? "Uploading…"}</span>
        <span>{pct}%</span>
      </div>
      <div className={cn("h-1.5 overflow-hidden rounded-full", c.track)}>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            c.bar,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
