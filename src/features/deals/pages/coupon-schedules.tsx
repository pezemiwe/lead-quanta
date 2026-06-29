import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  History,
  Play,
  Zap,
} from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { usePersona } from "../../../context/persona";
import { useNotifications } from "../../../context/notifications";
import type { CorporateAction, CorporateActionStatus } from "../../workflow/types";
import {
  BOOK_INSTRUMENTS,
  fmtCompact,
  fmtDate,
  daysBetween,
} from "../../portfolio/engine/book-compute";

const TODAY = "2026-06-28";

const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`;
void fmtPct;

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function derivedStatus(eventDate: string, base: CorporateActionStatus): CorporateActionStatus {
  if (base === "Processed" || base === "Failed" || base === "Cancelled") return base;
  const days = daysBetween(TODAY, eventDate);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due Today";
  return "Upcoming";
}

const STATUS_STYLE: Record<CorporateActionStatus, { badge: string; icon: React.ReactNode }> = {
  Upcoming: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    icon: <Clock className="h-3 w-3" />,
  },
  "Due Today": {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  Overdue: {
    badge: "bg-red-50 text-red-600 border-red-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  Processing: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
  },
  Processed: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  Failed: {
    badge: "bg-red-100 text-red-700 border-red-300",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  Cancelled: {
    badge: "bg-gray-100 text-gray-500 border-gray-200",
    icon: <Clock className="h-3 w-3" />,
  },
};

function StatusPill({ status }: { status: CorporateActionStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.badge}`}
    >
      {s.icon}
      {status}
    </span>
  );
}

function glRef() {
  return `GL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

const STORAGE_KEY = "lq_corp_actions_v1";

function loadActions(seed: CorporateAction[]): CorporateAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CorporateAction[]) : seed;
  } catch {
    return seed;
  }
}

function saveActions(actions: CorporateAction[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  } catch {
    // ignore
  }
}

function buildSeed(): CorporateAction[] {
  const seed: CorporateAction[] = [];
  let idx = 1;

  for (const inst of BOOK_INSTRUMENTS) {
    if (!inst.couponRate || inst.couponRate === 0 || !inst.maturityDate) continue;

    const freqMonths =
      inst.couponFrequency === "Semi"
        ? 6
        : inst.couponFrequency === "Annual"
          ? 12
          : inst.couponFrequency === "Quarterly"
            ? 3
            : 0;
    if (freqMonths === 0) continue;

    const periodCoupon = (inst.faceValue * inst.couponRate) / (12 / freqMonths);

    let d = new Date(inst.purchaseDate + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + freqMonths);
    const mat = new Date(inst.maturityDate + "T00:00:00Z");
    const refDate = new Date(TODAY + "T00:00:00Z");

    while (d.getTime() <= refDate.getTime() + 90 * 864e5 && d.getTime() <= mat.getTime()) {
      const dateStr = d.toISOString().slice(0, 10);
      const daysAway = daysBetween(TODAY, dateStr);
      let status: CorporateActionStatus = "Upcoming";
      let processedAt: string | undefined;
      let processedBy: string | undefined;
      let gl: string | undefined;

      if (daysAway < -5) {
        status = "Processed";
        processedAt = new Date(d.getTime() + 86_400_000).toISOString();
        processedBy = "Adaeze Okonkwo";
        gl = glRef();
      } else if (daysAway < 0) {
        status = "Overdue";
      } else if (daysAway === 0) {
        status = "Due Today";
      }

      seed.push({
        id: `CA-${String(idx).padStart(4, "0")}`,
        instrumentId: inst.id,
        instrumentName: inst.name,
        issuer: inst.issuer,
        type: "Coupon Payment",
        eventDate: dateStr,
        paymentDate: dateStr,
        amount: periodCoupon,
        currency: inst.currency ?? "NGN",
        status,
        processedAt,
        processedBy,
        glRef: gl,
      });
      idx++;
      d.setUTCMonth(d.getUTCMonth() + freqMonths);
    }

    // Maturity event
    const matDays = daysBetween(TODAY, inst.maturityDate);
    if (matDays >= -10 && matDays <= 90) {
      let mStatus: CorporateActionStatus = matDays < 0 ? "Overdue" : matDays === 0 ? "Due Today" : "Upcoming";
      let processedAt: string | undefined;
      let processedBy: string | undefined;
      let gl: string | undefined;
      if (matDays < -5) {
        mStatus = "Processed";
        processedAt = new Date(mat.getTime() + 86_400_000).toISOString();
        processedBy = "Settlement Ops";
        gl = glRef();
      }
      seed.push({
        id: `CA-${String(idx).padStart(4, "0")}`,
        instrumentId: inst.id,
        instrumentName: inst.name,
        issuer: inst.issuer,
        type: "Principal Maturity",
        eventDate: inst.maturityDate,
        paymentDate: inst.maturityDate,
        amount: inst.faceValue,
        currency: inst.currency ?? "NGN",
        status: mStatus,
        processedAt,
        processedBy,
        glRef: gl,
      });
      idx++;
    }
  }

  // Add a few FD rollovers and dividends for richness
  seed.push(
    {
      id: `CA-${String(idx++).padStart(4, "0")}`,
      instrumentId: "fd-zenith-01",
      instrumentName: "Zenith Bank 90-Day FD",
      issuer: "Zenith Bank",
      type: "FD Rollover",
      eventDate: "2026-07-15",
      paymentDate: "2026-07-15",
      amount: 2_500_000_000,
      currency: "NGN",
      status: "Upcoming",
    },
    {
      id: `CA-${String(idx++).padStart(4, "0")}`,
      instrumentId: "eq-dangote-01",
      instrumentName: "Dangote Cement Plc — H1 2026 Dividend",
      issuer: "Dangote Industries",
      type: "Dividend",
      eventDate: "2026-07-02",
      paymentDate: "2026-07-09",
      amount: 48_600_000,
      currency: "NGN",
      status: "Upcoming",
    },
    {
      id: `CA-${String(idx++).padStart(4, "0")}`,
      instrumentId: "eq-mtn-01",
      instrumentName: "MTN Nigeria — Final Dividend 2026",
      issuer: "MTN Nigeria",
      type: "Dividend",
      eventDate: "2026-06-28",
      paymentDate: "2026-07-05",
      amount: 31_200_000,
      currency: "NGN",
      status: "Due Today",
    },
    {
      id: `CA-${String(idx++).padStart(4, "0")}`,
      instrumentId: "fd-access-01",
      instrumentName: "Access Bank 60-Day FD",
      issuer: "Access Bank",
      type: "FD Rollover",
      eventDate: "2026-06-20",
      paymentDate: "2026-06-20",
      amount: 1_800_000_000,
      currency: "NGN",
      status: "Processed",
      processedAt: "2026-06-20T14:32:00.000Z",
      processedBy: "Adaeze Okonkwo",
      glRef: glRef(),
    },
  );

  return seed;
}

type Tab = "upcoming" | "queue" | "history";

export function CouponSchedules() {
  const { persona } = usePersona();
  const { addNotification } = useNotifications();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [actions, setActions] = useState<CorporateAction[]>(() => loadActions(buildSeed()));
  const [processing, setProcessing] = useState<string | null>(null);

  const enriched = useMemo(
    () => actions.map((a) => ({ ...a, status: derivedStatus(a.eventDate, a.status) })),
    [actions],
  );

  const upcoming = useMemo(
    () =>
      enriched
        .filter((a) => a.status === "Upcoming")
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
    [enriched],
  );

  const queue = useMemo(
    () =>
      enriched
        .filter((a) => a.status === "Due Today" || a.status === "Overdue")
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
    [enriched],
  );

  const history = useMemo(
    () =>
      enriched
        .filter((a) => a.status === "Processed" || a.status === "Failed" || a.status === "Cancelled")
        .sort((a, b) => (b.processedAt ?? "").localeCompare(a.processedAt ?? "")),
    [enriched],
  );

  const totalDue = useMemo(
    () => queue.reduce((s, a) => s + a.amount, 0),
    [queue],
  );

  function processAction(id: string) {
    setProcessing(id);
    setTimeout(() => {
      const gl = glRef();
      setActions((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "Processed" as CorporateActionStatus,
                processedAt: new Date().toISOString(),
                processedBy: persona.name,
                glRef: gl,
              }
            : a,
        );
        saveActions(next);
        return next;
      });
      setProcessing(null);
      const action = actions.find((a) => a.id === id);
      if (action) {
        addNotification({
          type: "deal",
          severity: "info",
          title: `${action.type} Processed`,
          body: `${action.instrumentName} — ${fmtCompact(action.amount)} ${action.type.toLowerCase()} processed. GL Ref: ${gl}.`,
          link: "/deal-capture/coupon-schedules",
        });
      }
    }, 1200);
  }

  const TABS: { id: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: "upcoming", label: "Upcoming Events", count: upcoming.length, icon: <Clock className="h-3.5 w-3.5" /> },
    { id: "queue", label: "Process Queue", count: queue.length, icon: <Zap className="h-3.5 w-3.5" /> },
    { id: "history", label: "Processed History", count: history.length, icon: <History className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6 p-5 lg:p-7">
      {/* ── Header ── */}
      <div>
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
          Deal Capture
        </p>
        <h1 className="text-xl font-bold tracking-tight text-dark-gray">
          Corporate Actions
        </h1>
        <p className="mt-1 text-xs text-dark-gray/45">
          Coupon payments, principal maturities, FD rollovers, and dividends — reference date {fmtDate(TODAY)}.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <StatCardGrid>
        <StatCard
          title="Upcoming (Next 90 Days)"
          value={String(upcoming.length)}
          subtitle="Corporate actions scheduled"
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <StatCard
          title="Process Queue"
          value={String(queue.length)}
          subtitle="Due today or overdue"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={queue.length > 0 ? "warning" : "default"}
          trend={
            queue.length > 0
              ? { label: `${fmtCompact(totalDue)} due`, direction: "neutral" }
              : undefined
          }
        />
        <StatCard
          title="Processed (All Time)"
          value={String(history.length)}
          subtitle="Successfully settled"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Total Cash Due"
          value={fmtCompact(totalDue)}
          subtitle="In process queue"
          icon={<Zap className="h-4 w-4" />}
          variant={totalDue > 0 ? "highlight" : "default"}
        />
      </StatCardGrid>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              tab === t.id
                ? "bg-surface text-dark-gray shadow-sm"
                : "text-dark-gray/50 hover:text-dark-gray"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                  t.id === "queue" && t.count > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "upcoming" && (
        <SectionCard title="Upcoming Corporate Actions" description="Next 90 days · sorted by event date">
          <ActionTable rows={upcoming} showProcess={false} processing={processing} onProcess={processAction} />
        </SectionCard>
      )}

      {tab === "queue" && (
        <SectionCard
          title="Process Queue"
          description="Actions due today or overdue — must be processed before cut-off"
          actions={
            queue.length > 0 ? (
              <span className="text-xs font-semibold text-amber-600">
                {queue.length} action{queue.length > 1 ? "s" : ""} require attention
              </span>
            ) : undefined
          }
        >
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-dark-gray/50">All caught up! No actions due.</p>
            </div>
          ) : (
            <ActionTable rows={queue} showProcess processing={processing} onProcess={processAction} />
          )}
        </SectionCard>
      )}

      {tab === "history" && (
        <SectionCard title="Processed History" description="Completed corporate actions with GL references">
          <ActionTable rows={history} showProcess={false} processing={processing} onProcess={processAction} />
        </SectionCard>
      )}
    </div>
  );
}

function ActionTable({
  rows,
  showProcess,
  processing,
  onProcess,
}: {
  rows: CorporateAction[];
  showProcess: boolean;
  processing: string | null;
  onProcess: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <CalendarClock className="h-7 w-7 text-dark-gray/15" />
        <p className="text-xs text-dark-gray/35">No actions in this category</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 text-xs">
        <thead>
          <tr className="border-b border-border">
            {["ID", "Instrument", "Issuer", "Type", "Event Date", "Amount", "Status", showProcess ? "Action" : "GL Ref"].map(
              (h) => (
                <th
                  key={h}
                  className="pb-2.5 pr-4 text-left font-semibold uppercase tracking-wider text-dark-gray/40 first:pl-0 last:pr-0 last:text-right"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-surface-muted/50">
              <td className="py-3 pr-4 font-mono text-dark-gray/50">{a.id}</td>
              <td className="py-3 pr-4">
                <p className="font-semibold text-dark-gray max-w-48 truncate">{a.instrumentName}</p>
                <p className="text-[10px] text-dark-gray/40">{a.currency}</p>
              </td>
              <td className="py-3 pr-4 text-dark-gray/60">{a.issuer}</td>
              <td className="py-3 pr-4">
                <Badge variant="neutral" size="sm">{a.type}</Badge>
              </td>
              <td className="py-3 pr-4 tabular-nums text-dark-gray/70">
                {fmtDate(a.eventDate)}
                {a.processedAt && (
                  <p className="text-[10px] text-dark-gray/35">
                    Processed {fmtDateTime(a.processedAt)}
                  </p>
                )}
              </td>
              <td className="py-3 pr-4 font-semibold tabular-nums text-dark-gray">
                {fmtCompact(a.amount)}
              </td>
              <td className="py-3 pr-4">
                <StatusPill status={a.status} />
              </td>
              <td className="py-3 text-right">
                {showProcess ? (
                  <button
                    onClick={() => onProcess(a.id)}
                    disabled={processing === a.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {processing === a.id ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" /> Processing…
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" /> Process
                      </>
                    )}
                  </button>
                ) : a.glRef ? (
                  <span className="font-mono text-[10px] text-emerald-600">{a.glRef}</span>
                ) : (
                  <span className="text-dark-gray/25">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!showProcess && rows.length > 0 && rows[0].processedBy && (
        <div className="mt-3 border-t border-border pt-3 text-[10px] text-dark-gray/35">
          Processed by: {[...new Set(rows.map((r) => r.processedBy).filter(Boolean))].join(", ")} ·
          GL references stored for audit trail
        </div>
      )}
    </div>
  );
}
