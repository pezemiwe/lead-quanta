import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { useMarketData } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { fmtBps, fmtPct, fmtTenor } from "../utils";

export function MarketDataAlerts() {
  const { state } = useMarketData();
  const { history } = state;
  const alerts = history.alerts;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 xl:p-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Yield Alerts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Auto-triggered when overnight yield move exceeds 25 bps · escalates to
          critical above 50 bps
        </p>
      </div>

      {alerts.length === 0 ? (
        <SectionCard>
          <div className="flex items-center gap-4 py-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-dark-gray">
                No alerts triggered
              </p>
              <p className="text-sm text-gray-500">
                All NGN tenors moved by less than 25 bps overnight.
              </p>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title={`Active alerts (${alerts.length})`}
          
        >
          <ul className="divide-y divide-border">
            {alerts.map((a) => (
              <li
                key={a.tenor}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                      a.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-dark-gray">
                      {fmtTenor(a.tenor)} NGN sovereign · {a.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fmtPct(a.oldYield, 3)} → {fmtPct(a.newYield, 3)} ·{" "}
                      {a.timestamp}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                      a.severity === "critical"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      a.changeBps > 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {fmtBps(a.changeBps)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

