import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, Info, ShieldAlert, X, CheckCheck } from "lucide-react";
import {
  useNotifications,
  type NotificationSeverity,
  type NotificationType,
} from "../../context/notifications";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  deal: <Info className="h-3.5 w-3.5" />,
  limit: <AlertTriangle className="h-3.5 w-3.5" />,
  settlement: <Info className="h-3.5 w-3.5" />,
  compliance: <ShieldAlert className="h-3.5 w-3.5" />,
  system: <Info className="h-3.5 w-3.5" />,
};

const SEV_STYLE: Record<NotificationSeverity, { icon: string; dot: string; bg: string }> = {
  info: { icon: "text-sky-500", dot: "bg-sky-400", bg: "hover:bg-sky-50/60" },
  warning: { icon: "text-amber-500", dot: "bg-amber-400", bg: "hover:bg-amber-50/60" },
  critical: { icon: "text-red-500", dot: "bg-red-500", bg: "hover:bg-red-50/60" },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const recent = notifications.slice(0, 12);
  const criticalCount = notifications.filter((n) => !n.read && n.severity === "critical").length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-dark-gray/50 transition hover:bg-surface-muted hover:text-dark-gray"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-0.5 text-[9px] font-black text-white ${
              criticalCount > 0 ? "bg-red-500" : "bg-primary"
            }`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[360px] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-bold text-dark-gray">Notifications</p>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold text-dark-gray/50 transition hover:bg-surface-muted hover:text-dark-gray"
                  title="Mark all read"
                >
                  <CheckCheck className="h-3 w-3" /> All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-dark-gray/30 transition hover:bg-surface-muted hover:text-dark-gray"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Bell className="h-7 w-7 text-dark-gray/15" />
                <p className="text-xs text-dark-gray/35">No notifications</p>
              </div>
            ) : (
              recent.map((n) => {
                const sev = SEV_STYLE[n.severity];
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead(n.id);
                      if (n.link) {
                        navigate(n.link);
                        setOpen(false);
                      }
                    }}
                    className={`flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition last:border-0 ${sev.bg} ${
                      !n.read ? "bg-surface-muted/40" : ""
                    }`}
                  >
                    {/* Severity icon */}
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        n.severity === "critical"
                          ? "bg-red-100"
                          : n.severity === "warning"
                            ? "bg-amber-100"
                            : "bg-sky-100"
                      } ${sev.icon}`}
                    >
                      {TYPE_ICON[n.type]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs leading-snug ${
                            !n.read ? "font-semibold text-dark-gray" : "font-medium text-dark-gray/70"
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-dark-gray/35 tabular-nums">
                          {relativeTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-dark-gray/50 line-clamp-2">
                        {n.body}
                      </p>
                    </div>

                    {!n.read && (
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${sev.dot}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-surface-muted/50 px-4 py-2.5">
            <p className="text-center text-[10px] text-dark-gray/35">
              Showing {recent.length} of {notifications.length} notifications
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
