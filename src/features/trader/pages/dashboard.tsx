import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, LogOut, Plus } from "lucide-react";
import { usePersona } from "../../../context/persona";
import {
  canDo,
  getTraderDeskLabel,
  isFrontOfficeTrader,
} from "../../../context/platform-personas";
import { useWorkflow } from "../../workflow/store";
import { dealNotional } from "../../workflow/engine/fields";
import { DealSlipWorkspace } from "../../workflow/components/deal-slip-workspace";
import {
  REF_DATE,
  buildMaturityRows,
  counterpartyUtilisation,
  fmtMoney,
  isToday,
} from "../utils/dashboard-metrics";
import { PermissionStatGrid } from "../../../components/shared/permission-stat-grid";
import { StatCard } from "../../../components/shared/stat-card";
import { TradeBlotter } from "../../deals/components/trade-blotter";
import { ReconciliationNotifications } from "../../../components/shared/reconciliation-notifications";

export function TradingDashboard() {
  const { persona, setPersona } = usePersona();
  const navigate = useNavigate();
  const wf = useWorkflow();
  const { dealSlips, register } = wf;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [maturityOpen, setMaturityOpen] = useState(true);

  const canBlotter = canDo(persona.role, "blotter", "V") || canDo(persona.role, "blotter", "C");
  const canCreate = canDo(persona.role, "dealSlip", "C");
  const canRegister = canDo(persona.role, "register", "V") || canDo(persona.role, "register", "S");
  const canLimits = canDo(persona.role, "limits", "V");

  if (!isFrontOfficeTrader(persona.role) || !canBlotter) {
    return <Navigate to="/modules" replace />;
  }

  const myDeals = useMemo(
    () =>
      dealSlips.filter(
        (d) => d.createdBy === persona.name || d.createdByRole === persona.role,
      ),
    [dealSlips, persona.name, persona.role],
  );

  const todayBookings = myDeals.filter((d) => isToday(d.createdAt));
  const todayNotional = todayBookings.reduce((s, d) => s + dealNotional(d.fields), 0);
  const pendingApproval = myDeals.filter((d) =>
    ["Submitted", "Under Review"].includes(d.status),
  ).length;
  const returnedCount = myDeals.filter((d) => d.status === "Returned for Amendment").length;
  const activeCount = register.length;
  const maturities = buildMaturityRows(register, myDeals);
  const maturingThisWeek = maturities.filter((m) => m.daysRemaining <= 7 && m.daysRemaining >= 0).length;
  const overdueMaturities = maturities.filter((m) => m.daysRemaining < 0).length;
  const limitTop = counterpartyUtilisation(dealSlips, register);

  return (
    <div className="min-h-screen bg-[#F7F7F8] font-sans">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/modules" className="text-xs font-medium text-dark-gray/45 hover:text-primary">
              ← Modules
            </Link>
            <div className="h-4 w-px bg-border" />
            <img src="/lead-logo.jpg" alt="" className="h-7 w-7 rounded-full" />
            <span className="text-sm font-bold text-primary">Leadway Quanta</span>
          </div>
          <div className="flex items-center gap-3">
            <ReconciliationNotifications />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-dark-gray">{persona.name}</p>
              <p className="text-xs text-dark-gray/45">{persona.role}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPersona({ name: "", role: "", avatar: "" });
                navigate("/");
              }}
              className="text-xs text-dark-gray/45 hover:text-dark-gray"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dark-gray">Trading Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-primary">{getTraderDeskLabel(persona.role)}</p>
            <p className="mt-0.5 text-xs text-dark-gray/45">As at {REF_DATE}</p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => navigate("/deal-capture/new-booking")}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Deal capture
            </button>
          )}
        </div>

        <PermissionStatGrid>
          {canCreate && (
            <StatCard
              title="Today's bookings"
              value={String(todayBookings.length)}
              subtitle={fmtMoney(todayNotional)}
              variant="highlight"
            />
          )}
          <StatCard
            title="Pending approval"
            value={String(pendingApproval)}
            subtitle="Submitted & under review"
            variant={pendingApproval > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Maturities this week"
            value={String(maturingThisWeek)}
            subtitle={overdueMaturities > 0 ? `${overdueMaturities} overdue` : "Next 7 days"}
            variant={overdueMaturities > 0 ? "danger" : maturingThisWeek > 0 ? "warning" : "default"}
          />
          {canLimits && (
            <div className="flex min-h-[7.5rem] flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-dark-gray/50">
                Counterparty limit
              </p>
              <p className="mt-3 text-3xl font-bold tabular-nums text-dark-gray">
                {limitTop.pct.toFixed(1)}%
              </p>
              <p className="mt-1 truncate text-xs text-dark-gray/50">{limitTop.name}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${limitTop.pct >= 80 ? "bg-danger" : limitTop.pct >= 60 ? "bg-warning" : "bg-success"}`}
                  style={{ width: `${Math.min(limitTop.pct, 100)}%` }}
                />
              </div>
            </div>
          )}
          {canRegister && (
            <button
              type="button"
              onClick={() => navigate("/deal-capture/settlements")}
              className="text-left"
            >
              <StatCard
                title="Active positions"
                value={String(activeCount)}
                subtitle="Investment register · click to view"
              />
            </button>
          )}
          {canCreate && (
            <StatCard
              title="Returned for amendment"
              value={String(returnedCount)}
              subtitle="Action required"
              variant={returnedCount > 0 ? "warning" : "default"}
            />
          )}
        </PermissionStatGrid>

        <TradeBlotter
          defaultMyDealsOnly
          showCaptureButton={false}
        />

        <section className="rounded-xl border border-border bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setMaturityOpen(!maturityOpen)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <h2 className="text-lg font-semibold text-dark-gray">Upcoming maturities</h2>
            {maturityOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {maturityOpen && (
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-dark-gray/50">
                  <tr>
                    <th className="px-4 py-2">Instrument</th>
                    <th className="px-4 py-2">Counterparty</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2">Maturity date</th>
                    <th className="px-4 py-2">Days remaining</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {maturities.map((m) => {
                    const urgent =
                      m.daysRemaining < 0
                        ? "text-danger bg-red-50"
                        : m.daysRemaining <= 3
                          ? "text-danger"
                          : m.daysRemaining <= 7
                            ? "text-amber-700"
                            : "";
                    return (
                      <tr key={m.id}>
                        <td className="px-4 py-2 text-xs">{m.instrument}</td>
                        <td className="px-4 py-2 text-xs">{m.counterparty}</td>
                        <td className="px-4 py-2 text-right text-xs tabular-nums">{m.amount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-xs">{m.maturityDate}</td>
                        <td className={`px-4 py-2 text-xs font-semibold ${urgent}`}>
                          {m.daysRemaining < 0 ? `${Math.abs(m.daysRemaining)}d overdue` : `${m.daysRemaining}d`}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2 text-[10px] font-semibold">
                            <button
                              type="button"
                              className="text-primary hover:underline"
                              onClick={() => navigate("/deal-capture/new-booking")}
                            >
                              Roll over
                            </button>
                            <button
                              type="button"
                              className="text-dark-gray/55 hover:underline"
                              onClick={() => m.dealSlipId && setSelectedId(m.dealSlipId)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {maturities.length === 0 && (
                <p className="py-8 text-center text-sm text-dark-gray/45">No maturities in the next 30 days.</p>
              )}
            </div>
          )}
        </section>
      </main>

      {selectedId && (
        <DealSlipWorkspace dealId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
