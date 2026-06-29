import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Timer, Wallet } from "lucide-react";
import { StatCard } from "../../../components/shared/stat-card";
import { PermissionStatGrid } from "../../../components/shared/permission-stat-grid";
import { usePersona } from "../../../context/persona";
import { canDo } from "../../../context/platform-personas";
import { useWorkflow } from "../../workflow/store";
import { inFlightStatuses } from "../../workflow/engine/transitions";
import { TradeBlotter } from "../components/trade-blotter";

export function DealBlotter() {
  const { persona } = usePersona();
  const navigate = useNavigate();
  const { dealSlips } = useWorkflow();

  const canCreate = canDo(persona.role, "dealSlip", "C");
  const canViewBlotter =
    canDo(persona.role, "blotter", "V") || canDo(persona.role, "blotter", "C");
  const canViewDeals =
    canDo(persona.role, "dealSlip", "V") || canDo(persona.role, "dealSlip", "C");
  const canViewRegister =
    canDo(persona.role, "register", "V") || canDo(persona.role, "register", "S");

  const inFlight = useMemo(
    () => dealSlips.filter((d) => inFlightStatuses().includes(d.status)).length,
    [dealSlips],
  );
  const active = useMemo(
    () => dealSlips.filter((d) => d.status === "Active").length,
    [dealSlips],
  );

  const defaultMyDealsOnly = canCreate && !canDo(persona.role, "approval", "A");

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark-gray">Trade blotter</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-dark-gray/55">
            Live deal slip register with filters, limit flags, and settlement tracking — scoped to your role.
          </p>
        </div>
      </div>

      <PermissionStatGrid>
        {canViewBlotter && (
          <StatCard
            title="Total deal slips"
            value={String(dealSlips.length)}
            subtitle="On blotter"
            icon={<ClipboardList className="h-5 w-5" />}
          />
        )}
        {canViewDeals && (
          <StatCard
            title="In flight"
            value={String(inFlight)}
            subtitle="Submitted through pending settlement"
            icon={<Timer className="h-5 w-5" />}
            variant="highlight"
          />
        )}
        {canViewRegister && (
          <button type="button" onClick={() => navigate("/deal-capture/settlements")} className="text-left">
            <StatCard
              title="Active positions"
              value={String(active)}
              subtitle="Settled in register · click to view"
              icon={<Wallet className="h-5 w-5" />}
            />
          </button>
        )}
      </PermissionStatGrid>

      <TradeBlotter
        defaultMyDealsOnly={defaultMyDealsOnly}
        showCaptureButton={canCreate}
      />
    </div>
  );
}
