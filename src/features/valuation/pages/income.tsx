import { useValuation } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtNumber } from "../utils";

export function ValuationIncome() {
  const v = useValuation();
  if (!v.hasData) return <EmptyPortfolio />;
  const { income } = v.result;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Income &amp; Profit/Loss Summary
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Aggregated income and profit/loss impact at the portfolio level.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Amortised Cost Portfolio">
          <Row label="Instruments" value={fmtNumber(income.ac.instruments)} />
          <Row
            label="Total Carrying Value"
            value={fmtNumber(income.ac.totalCarryingValueNGN, 0)}
            emphasis
          />
          <Row
            label="Total Accrued Interest"
            value={fmtNumber(income.ac.totalAccruedInterestNGN, 0)}
          />
          <Row
            label="Total ECL Provision"
            value={fmtNumber(income.ac.totalECLNGN, 0)}
          />
        </SectionCard>

        <SectionCard title="Fair Value (OCI) Portfolio">
          <Row
            label="Instruments"
            value={fmtNumber(income.fvoci.instruments)}
          />
          <Row
            label="Total Amortised Cost Carrying"
            value={fmtNumber(income.fvoci.totalACCarryingValueNGN, 0)}
          />
          <Row
            label="Total Fair Value"
            value={fmtNumber(income.fvoci.totalFairValueNGN, 0)}
            emphasis
          />
          <Row
            label="Total OCI Reserve"
            value={fmtNumber(income.fvoci.totalOCIReserveNGN, 0)}
            emphasis
          />
          <Row
            label="Total ECL Provision"
            value={fmtNumber(income.fvoci.totalECLNGN, 0)}
          />
        </SectionCard>

        <SectionCard title="Fair Value (P&L) Portfolio">
          <Row
            label="Instruments"
            value={fmtNumber(income.fvtpl.instruments)}
          />
          <Row
            label="Total Fair Value"
            value={fmtNumber(income.fvtpl.totalFairValueNGN, 0)}
            emphasis
          />
          <Row
            label="Total Unrealised Gain/(Loss) — P&L"
            value={fmtNumber(income.fvtpl.totalUnrealisedGLNGN, 0)}
            emphasis
          />
        </SectionCard>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span
        className={`font-mono ${emphasis ? "font-semibold text-dark-gray" : "text-dark-gray"}`}
      >
        ₦{value}
      </span>
    </div>
  );
}
