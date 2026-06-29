import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldAlert, FileText } from "lucide-react";
import { usePersona } from "../../context/persona";
import { canDo } from "../../context/platform-personas";
import { useWorkflow } from "../../features/workflow/store";
import { DealSlipWorkspace } from "../../features/workflow/components/deal-slip-workspace";
import {
  buildReconciliationItems,
  type ReconciliationSeverity,
} from "../../features/deals/utils/reconciliation";
import { REF_DATE } from "../../features/deals/utils/blotter-metrics";

const SEV_DOT: Record<ReconciliationSeverity, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

const SEV_RANK: Record<ReconciliationSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const PERIOD_FROM = `${REF_DATE.slice(0, 8)}01`;

export function ReconciliationNotifications() {
  const { persona } = usePersona();
  const { dealSlips, exceptions, register, syncVersion } = useWorkflow();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canSettle = canDo(persona.role, "settle", "S");
  const canView =
    canSettle ||
    canDo(persona.role, "register", "V") ||
    canDo(persona.role, "register", "S") ||
    canDo(persona.role, "blotter", "V") ||
    canDo(persona.role, "blotter", "C");

  const items = useMemo(() => {
    const list = buildReconciliationItems(dealSlips, exceptions, {
      register,
      dateFrom: PERIOD_FROM,
      dateTo: REF_DATE,
    });
    return [...list].sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
  }, [dealSlips, exceptions, register, syncVersion]);

  const critical = items.filter((i) => i.severity === "critical").length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!canView) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-dark-gray/55 transition-colors hover:bg-surface-muted hover:text-dark-gray"
          aria-label={`Notifications${items.length > 0 ? `, ${items.length} open` : ""}`}
        >
          <ShieldAlert className="h-4 w-4" />
          {items.length > 0 && (
            <span
              className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${
                critical > 0 ? "bg-red-500" : "bg-amber-500"
              }`}
            >
              {items.length > 9 ? "9+" : items.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,420px)] overflow-hidden rounded-xl border border-border bg-white shadow-xl">
            <div className="border-b border-border bg-[#FAFBFC] px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-dark-gray">Settlement Alerts</h3>
                {items.length > 0 && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      critical > 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {items.length} open
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-dark-gray/45">
                Settlement &amp; reconciliation
                {!canSettle && " · read-only"}
              </p>
            </div>

            <div className="max-h-[min(60vh,420px)] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-dark-gray/45">
                  All settlements matched — no open items.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li key={item.id} className="px-4 py-3 hover:bg-gray-50/60">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEV_DOT[item.severity]}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-dark-gray">{item.label}</p>
                            {item.amount != null && (
                              <span className="shrink-0 text-[11px] tabular-nums text-dark-gray/55">
                                ₦{item.amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-dark-gray/50">
                            {item.detail}
                          </p>
                          {item.custodian && (
                            <p className="mt-0.5 text-[10px] text-dark-gray/40">
                              Custodian: {item.custodian}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            {item.dealSlipId !== "—" ? (
                              <span className="font-mono text-[10px] font-medium text-dark-gray/55">
                                {item.dealSlipId}
                              </span>
                            ) : (
                              <span />
                            )}
                            {item.dealSlipId !== "—" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedId(item.dealSlipId);
                                  setOpen(false);
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/20"
                              >
                                <FileText className="h-3 w-3" />
                                View slip
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <DealSlipWorkspace dealId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
