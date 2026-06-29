import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type NotificationType = "deal" | "limit" | "settlement" | "compliance" | "system";
export type NotificationSeverity = "info" | "warning" | "critical";

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "timestamp">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = "lq_notifications_v1";

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : SEED;
  } catch {
    return SEED;
  }
}

function save(ns: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ns.slice(0, 100)));
  } catch {
    // ignore
  }
}

function uid() {
  return `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const now = new Date();
const mins = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

const SEED: AppNotification[] = [
  {
    id: "ntf_001",
    type: "deal",
    severity: "info",
    title: "Deal Approved",
    body: "FGN Bond — ₦2.5B purchase approved by the CIO. Pending settlement.",
    timestamp: mins(8),
    read: false,
    link: "/deal-capture/blotter",
  },
  {
    id: "ntf_002",
    type: "limit",
    severity: "warning",
    title: "Limit Warning — Zenith Bank",
    body: "Counterparty exposure at 84% of approved limit (₦21.0B / ₦25.0B). Review before booking further trades.",
    timestamp: mins(23),
    read: false,
    link: "/deal-capture/exposure",
  },
  {
    id: "ntf_003",
    type: "settlement",
    severity: "info",
    title: "Settlement Confirmed",
    body: "TB-20260615 — ₦500M Treasury Bill settled successfully. GL reference: GL-2026-0041.",
    timestamp: mins(45),
    read: true,
    link: "/deal-capture/settlements",
  },
  {
    id: "ntf_004",
    type: "deal",
    severity: "info",
    title: "Deal Submitted for Review",
    body: "MTN Nigeria CP — ₦1.2B submitted by Chukwuemeka Okafor. Awaiting Middle Office review.",
    timestamp: mins(90),
    read: true,
    link: "/deal-capture/approvals",
  },
  {
    id: "ntf_005",
    type: "compliance",
    severity: "critical",
    title: "NAICOM Limit Breach — Telecoms",
    body: "Telecoms sector concentration at 12.1% — exceeds NAICOM maximum of 10.0%. Immediate action required.",
    timestamp: mins(140),
    read: false,
    link: "/governance/compliance",
  },
  {
    id: "ntf_006",
    type: "system",
    severity: "info",
    title: "Valuation Run Complete",
    body: "Daily fair value computation completed for 47 instruments. Total portfolio: ₦298.4B.",
    timestamp: mins(200),
    read: true,
    link: "/valuation",
  },
  {
    id: "ntf_007",
    type: "deal",
    severity: "warning",
    title: "Deal Returned for Amendment",
    body: "Dangote FD — ₦3.0B returned by Middle Office. Counterparty confirmation document missing.",
    timestamp: mins(320),
    read: false,
    link: "/deal-capture/blotter",
  },
];

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(load);

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "read" | "timestamp">) => {
      setNotifications((prev) => {
        const next = [
          { ...n, id: uid(), read: false, timestamp: new Date().toISOString() },
          ...prev,
        ].slice(0, 100);
        save(next);
        return next;
      });
    },
    [],
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      save(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    save([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
