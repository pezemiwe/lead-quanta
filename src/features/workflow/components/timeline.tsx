import { CheckCircle2, Circle, XCircle } from "lucide-react";
import type { DealSlipStatus } from "../types";
import { STATUS_ORDER } from "../engine/transitions";

const MAIN_PATH: DealSlipStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Pending Settlement",
  "Settled",
  "Active",
];

export function DealSlipTimeline({ status }: { status: DealSlipStatus }) {
  const terminal =
    status === "Rejected" || status === "Returned for Amendment" || status === "Matured, Sold or Rolled Over";
  const idx = MAIN_PATH.indexOf(status === "Returned for Amendment" ? "Submitted" : status);

  return (
    <div className="space-y-1">
      <ol className="flex flex-wrap items-center gap-1">
        {MAIN_PATH.map((step, i) => {
          const done = !terminal && idx >= 0 && i <= idx;
          const current = step === status || (status === "Returned for Amendment" && step === "Submitted");
          const Icon = status === "Rejected" && i === 3 ? XCircle : done ? CheckCircle2 : Circle;
          return (
            <li key={step} className="flex items-center gap-1">
              {i > 0 && <span className="text-dark-gray/25">→</span>}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  current
                    ? "bg-primary/15 text-primary"
                    : done
                      ? "bg-success/10 text-success"
                      : "bg-gray-100 text-dark-gray/40"
                }`}
              >
                <Icon className="h-3 w-3" />
                {step}
              </span>
            </li>
          );
        })}
      </ol>
      {(status === "Rejected" || status === "Returned for Amendment") && (
        <p className="text-xs font-medium text-warning">
          Branch: {status} — {STATUS_ORDER.includes(status) ? "see workflow rules" : ""}
        </p>
      )}
    </div>
  );
}
