import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CheckCircle2, XCircle, X, Info } from "lucide-react";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type ToastType = "success" | "error" | "info";
type ToastPosition =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "top-right"
  | "top-left";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
};

type ToastOptions = { title: string; description?: string; duration?: number };

const positionCls: Record<ToastPosition, string> = {
  "bottom-right": "bottom-5 right-5 items-end",
  "bottom-left": "bottom-5 left-5 items-start",
  "bottom-center": "bottom-5 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-5 right-5 items-end",
  "top-left": "top-5 left-5 items-start",
};

const toastStyles: Record<
  ToastType,
  { icon: React.ReactNode; bar: string; iconCls: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-4.5 w-4.5" />,
    bar: "bg-emerald-500",
    iconCls: "text-emerald-500",
  },
  error: {
    icon: <XCircle className="h-4.5 w-4.5" />,
    bar: "bg-danger",
    iconCls: "text-danger",
  },
  info: {
    icon: <Info className="h-4.5 w-4.5" />,
    bar: "bg-primary",
    iconCls: "text-primary",
  },
};

type Subscriber = (toasts: Toast[]) => void;
const subscribers = new Set<Subscriber>();
let toasts: Toast[] = [];

const emit = (next: Toast[]) => {
  toasts = next;
  subscribers.forEach((fn) => fn(toasts));
};
const fire = (type: ToastType, opts: ToastOptions) => {
  const id = Math.random().toString(36).slice(2);
  emit([
    ...toasts,
    {
      id,
      type,
      title: opts.title,
      description: opts.description,
      duration: opts.duration ?? 4500,
    },
  ]);
};
const dismiss = (id: string) => emit(toasts.filter((t) => t.id !== id));

export const toaster = {
  success: (opts: ToastOptions) => fire("success", opts),
  error: (opts: ToastOptions) => fire("error", opts),
  info: (opts: ToastOptions) => fire("info", opts),
};

const ToastItem = ({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(t);
  }, [toast.duration, onDismiss]);

  const { icon, bar, iconCls } = toastStyles[toast.type];
  return (
    <div
      role="alert"
      className="flex w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
    >
      <div className={cn("w-1 shrink-0", bar)} />
      <div className="flex flex-1 gap-3 px-4 py-3.5">
        <span className={cn("mt-0.5 shrink-0", iconCls)} aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-dark-gray">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-xs text-dark-gray/55">
              {toast.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-dark-gray/35 hover:text-dark-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export const Toaster = ({
  position = "bottom-right",
}: {
  position?: ToastPosition;
}) => {
  const [items, setItems] = useState<Toast[]>([]);
  const sub = useCallback((t: Toast[]) => setItems([...t]), []);
  useEffect(() => {
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
    };
  }, [sub]);

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed z-[99] flex flex-col gap-2",
        positionCls[position],
      )}
    >
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>,
    document.body,
  );
};
