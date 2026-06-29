import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LimitPreviewRow } from "../utils/capture-limits";
import { fmtMoney } from "../utils/blotter-metrics";

function pct(current: number, limit: number): string {
  return `${Math.min(999, Math.round((current / limit) * 100))}%`;
}

function StatusBadge({ status }: { status: LimitPreviewRow["status"] }) {
  if (status === "breach") {
    return (
      <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
        Breach
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
      Watch
    </span>
  );
}

export function LimitAlertsBanner({ alerts }: { alerts: LimitPreviewRow[] }) {
  if (alerts.length === 0) return null;

  const critical = alerts.some((a) => a.status === "breach");

  return (
    <div
      className={`flex gap-3 rounded-lg border px-4 py-3 ${
        critical
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">
          {critical ? "Limit breach — Compliance waiver required" : "Approaching limit thresholds"}
        </p>
        <ul className="mt-1 space-y-0.5 text-xs opacity-90">
          {alerts.map((row) => (
            <li key={row.key}>
              {row.label}: {pct(row.current, row.limit)} utilised
              {row.thisDeal > 0 && ` · this deal ${fmtMoney(row.thisDeal)}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function LimitAlertsPanel({ alerts }: { alerts: LimitPreviewRow[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        All limit checks passed.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-dark-gray/45">
        Limit checks
      </p>
      <ul className="space-y-2">
        {alerts.map((row) => (
          <li
            key={row.key}
            className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${
              row.status === "breach"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="min-w-0">
              <p className="font-medium text-dark-gray">{row.label}</p>
              <p className="mt-0.5 text-xs text-dark-gray/55">
                {fmtMoney(row.current)} of {fmtMoney(row.limit)} ({pct(row.current, row.limit)})
              </p>
            </div>
            <StatusBadge status={row.status} />
          </li>
        ))}
      </ul>
      {alerts.some((a) => a.status === "breach") && (
        <p className="text-xs text-red-700">
          Breached limits require a Compliance waiver before approval.
        </p>
      )}
    </div>
  );
}
