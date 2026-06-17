import { FileX } from "lucide-react";
import {
  BOOK_COMPUTED,
  fmtCompact,
} from "../../../features/portfolio/engine/book-compute";

export function Disposals() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Lifecycle
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          Disposal Accounting
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Realised gain/loss computation and OCI recycling on disposal as at 28
          May 2026
        </p>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Disposals YTD", value: "0", sub: "no disposals recorded" },
          { label: "Realised G/L YTD", value: "₦0", sub: "no events" },
          { label: "OCI Recycled YTD", value: "₦0", sub: "FVOCI only" },
          {
            label: "Active Instruments",
            value: String(BOOK_COMPUTED.totals.instruments),
            sub: "currently in book",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="mt-2 text-xl font-bold text-dark-gray">{k.value}</p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* empty state */}
      <div className="rounded-xl border border-border bg-surface p-10 shadow-sm flex flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <FileX className="h-7 w-7 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-dark-gray">
            No Disposals in Current Period
          </p>
          <p className="mt-1 text-sm text-gray-400 max-w-sm">
            All 204 instruments remain active in the current book. Disposal
            events will appear here when instruments are sold, transferred, or
            derecognised.
          </p>
        </div>
      </div>

      {/* policy notes */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-dark-gray">
          Disposal Accounting Policy (IFRS 9)
        </h2>
        <ul className="space-y-2 text-sm text-gray-500 list-disc list-inside">
          <li>
            Realised gain/loss = proceeds less amortised cost carrying value at
            disposal date
          </li>
          <li>
            OCI reserve on FVOCI instruments recycled to P&amp;L on disposal
            (reclassification adjustment)
          </li>
          <li>
            FVTPL instruments: fair value change already in P&amp;L; disposal
            recognises final settlement
          </li>
          <li>
            AC instruments: disposal at amortised cost; any discount/premium
            fully amortised via EIR
          </li>
        </ul>
      </div>
    </div>
  );
}
