import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { Badge } from "../../../components/shared/badge";
import type { ControlCheck } from "../types";
import { canDo } from "../../../context/platform-personas";

const STATUS_STYLE: Record<ControlCheck["status"], "success" | "warning" | "danger" | "neutral" | "info"> = {
  pass: "success",
  cleared: "success",
  watch: "warning",
  breach: "danger",
  pending: "info",
};

export function ChecksPanel({
  checks,
  role,
  onClear,
}: {
  checks: ControlCheck[];
  role: string;
  onClear?: (checkId: string, fn: "Middle Office" | "Risk Management" | "Compliance") => void;
}) {
  const canClear = canDo(role, "checks", "R");

  const fnForRole = (): "Middle Office" | "Risk Management" | "Compliance" | null => {
    if (role === "Middle Office") return "Middle Office";
    if (role === "Risk Management") return "Risk Management";
    if (role === "Compliance") return "Compliance";
    return null;
  };

  const reviewerFn = fnForRole();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-dark-gray">Control checks</h3>
      </div>
      {checks.length === 0 ? (
        <p className="text-xs text-dark-gray/45">Checks run on submission.</p>
      ) : (
        <ul className="space-y-2">
          {checks.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-dark-gray">{c.label}</span>
                  <Badge variant={STATUS_STYLE[c.status]} size="sm">
                    {c.status}
                  </Badge>
                  <span className="text-[10px] uppercase text-dark-gray/35">{c.type}</span>
                </div>
                <p className="mt-0.5 text-xs text-dark-gray/55">{c.detail}</p>
                {c.reviewer && (
                  <p className="mt-1 text-[10px] text-dark-gray/40">
                    Cleared by {c.reviewer}
                  </p>
                )}
              </div>
              {canClear &&
                reviewerFn &&
                onClear &&
                (c.status === "pending" || c.status === "watch" || c.status === "breach") && (
                  <button
                    type="button"
                    onClick={() => onClear(c.id, reviewerFn)}
                    className="shrink-0 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-primary hover:bg-pale-red"
                  >
                    Clear
                  </button>
                )}
            </li>
          ))}
        </ul>
      )}
      {checks.some((c) => c.status === "breach") && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Open breaches must be routed for waiver before approval.
        </div>
      )}
      {checks.every((c) => c.status === "pass" || c.status === "cleared") && checks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          All checks passed or cleared.
        </div>
      )}
    </div>
  );
}
