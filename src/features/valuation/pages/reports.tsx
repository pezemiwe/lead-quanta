import * as XLSX from "xlsx";
import { Download, FileText } from "lucide-react";
import { useValuation } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtNumber } from "../utils";

export function ValuationReports() {
  const v = useValuation();
  if (!v.hasData) return <EmptyPortfolio />;

  const exportXlsx = () => {
    const headers = [
      "ID", "Name", "Instrument Type", "Issuer", "Sector", "Classification",
      "Currency", "Face Value", "Purchase Price", "Purchase Date", "Maturity Date",
      "Coupon Rate", "Coupon Frequency", "IFRS 13 Level",
      "AC Carrying Value", "Clean Fair Value", "OCI Reserve",
      "Unrealised G/L", "Balance Sheet Value (NGN)",
    ];
    const rows = v.result.valuations.map((vv) => {
      const i = vv.instrument;
      return [
        i.id, i.name, i.instrumentType, i.issuer, i.sector, i.classification,
        i.currency, i.faceValue, i.purchasePrice, i.purchaseDate, i.maturityDate,
        i.couponRate, i.couponFrequency, i.ifrs13Level,
        +vv.acCarryingValue.toFixed(2), +vv.cleanFairValue.toFixed(2),
        +vv.ociReserve.toFixed(2), +vv.unrealisedGL.toFixed(2),
        +vv.balanceSheetValueNGN.toFixed(2),
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Valuation Portfolio");
    XLSX.writeFile(wb, `valuation-portfolio-${v.assumptions.valuationDate}.xlsx`);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Reports & Exports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Download portfolio snapshots and valuation results.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={exportXlsx}
          className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-primary hover:bg-pale-red/20"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pale-red text-primary group-hover:bg-primary group-hover:text-white">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark-gray">
              Full Portfolio Excel
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              All {v.instruments.length} instruments with EIR carrying value,
              fair value, OCI reserve, and balance sheet figures.
            </p>
          </div>
        </button>

        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-surface p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark-gray">
              IFRS 13 Disclosure Pack
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Coming soon — Level 1/2/3 breakdown, fair value hierarchy, and
              sensitivity tables packaged as PDF.
            </p>
          </div>
        </div>
      </div>

      <SectionCard title="Portfolio Snapshot">
        <div className="grid gap-y-2 text-sm sm:grid-cols-2">
          <Row
            label="Total instruments"
            value={fmtNumber(v.result.totals.instruments)}
          />
          <Row label="Valuation date" value={v.assumptions.valuationDate} />
          <Row
            label="Total face value (NGN)"
            value={fmtNumber(v.result.totals.totalFaceValueNGN, 0)}
          />
          <Row
            label="Total balance sheet (NGN)"
            value={fmtNumber(v.result.totals.totalBSValueNGN, 0)}
          />
          <Row
            label="Total OCI reserve (NGN)"
            value={fmtNumber(v.result.totals.totalOCIReserveNGN, 0)}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 py-2 pr-6">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono text-dark-gray">{value}</span>
    </div>
  );
}
