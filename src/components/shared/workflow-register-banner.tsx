import { Link } from "react-router-dom";
import { useWorkflow } from "../../features/workflow/store";
import { inFlightStatuses } from "../../features/workflow/engine/transitions";

/** Cross-module banner: register is source of truth; in-flight deals are not holdings. */
export function WorkflowRegisterBanner() {
  const { dealSlips, register, exceptions } = useWorkflow();
  const inFlight = dealSlips.filter((d) => inFlightStatuses().includes(d.status));
  const openExceptions = exceptions.filter((e) => e.status !== "closed");

  return (
    <div className="mb-6 rounded-xl border border-primary/15 bg-gradient-to-r from-pale-red/60 to-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Investment register (workflow)
          </p>
          <p className="text-sm text-dark-gray/70">
            <span className="font-semibold text-dark-gray">{register.length}</span> settled active positions ·{" "}
            <span className="font-semibold text-dark-gray">{inFlight.length}</span> in-flight deal slips ·{" "}
            <span className="font-semibold text-dark-gray">{openExceptions.length}</span> open exceptions
          </p>
          <p className="mt-0.5 text-xs text-dark-gray/45">
            Holdings below include legacy seed book. New positions enter only after settlement confirmation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/deal-capture/blotter"
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-dark-gray hover:border-primary"
          >
            Deal blotter
          </Link>
          <Link
            to="/deal-capture/settlements"
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-dark-gray hover:border-primary"
          >
            Register
          </Link>
          <Link
            to="/deal-capture/exceptions"
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-dark-gray hover:border-primary"
          >
            Exceptions
          </Link>
        </div>
      </div>
    </div>
  );
}
