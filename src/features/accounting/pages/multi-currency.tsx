import {
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
} from "../../../features/portfolio/engine/book-compute";
import {
  DataTable,
  DataTableColumn,
} from "../../../components/shared/data-table";

const FX_USD = 1580;
const FX_GBP = 2010;
const FX_EUR = 1720;

type FXRow = {
  id: string;
  name: string;
  currency: string;
  faceValue: number;
  fxRate: number;
  bsvNGN: number;
  unrealisedFX: number;
  classification: string;
};

const ROWS: FXRow[] = BOOK_INSTRUMENTS.filter((i) => i.currency !== "NGN").map(
  (inst) => {
    const allIdx = BOOK_INSTRUMENTS.indexOf(inst);
    const val = BOOK_VALUATIONS[allIdx];
    const rate =
      inst.currency === "USD"
        ? FX_USD
        : inst.currency === "GBP"
          ? FX_GBP
          : FX_EUR;
    const bsvNGN = val?.balanceSheetValueNGN ?? inst.faceValue * rate;
    // unrealised FX: 2% ngn appreciation scenario
    const unrealisedFX = bsvNGN * 0.02;
    return {
      id: inst.id,
      name: inst.name,
      currency: inst.currency,
      faceValue: inst.faceValue,
      fxRate: rate,
      bsvNGN,
      unrealisedFX,
      classification: inst.classification,
    };
  },
);

// Group by currency
const byCurrency = new Map<
  string,
  { count: number; bsvNGN: number; unrealised: number }
>();
ROWS.forEach((r) => {
  const cur = byCurrency.get(r.currency) ?? {
    count: 0,
    bsvNGN: 0,
    unrealised: 0,
  };
  cur.count++;
  cur.bsvNGN += r.bsvNGN;
  cur.unrealised += r.unrealisedFX;
  byCurrency.set(r.currency, cur);
});

const totalFCY = ROWS.reduce((s, r) => s + r.bsvNGN, 0);
const totalPortfolio = BOOK_COMPUTED.totals.totalBSValueNGN;
const totalUnrealisedFX = ROWS.reduce((s, r) => s + r.unrealisedFX, 0);

const CCY_STYLE: Record<string, string> = {
  USD: "bg-green-100 text-green-700",
  GBP: "bg-blue-100 text-blue-700",
  EUR: "bg-purple-100 text-purple-700",
};

const COLUMNS: DataTableColumn<FXRow>[] = [
  {
    key: "name",
    header: "Instrument",
    render: (r) => (
      <span className="text-xs font-medium text-dark-gray">{r.name}</span>
    ),
  },
  {
    key: "currency",
    header: "CCY",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${CCY_STYLE[r.currency] ?? "bg-gray-100 text-gray-500"}`}
      >
        {r.currency}
      </span>
    ),
  },
  {
    key: "fxRate",
    header: "FX Rate (NGN)",
    render: (r) => (
      <span className="text-xs text-gray-500">{r.fxRate.toLocaleString()}</span>
    ),
  },
  {
    key: "faceValue",
    header: "Face Value (FCY)",
    render: (r) => (
      <span className="text-xs text-right block">
        {fmtCompact(r.faceValue)}
      </span>
    ),
  },
  {
    key: "bsvNGN",
    header: "BS Value (₦)",
    render: (r) => (
      <span className="text-xs font-semibold text-right block">
        {fmtCompact(r.bsvNGN)}
      </span>
    ),
  },
  {
    key: "unrealisedFX",
    header: "Unrealised FX (₦)",
    render: (r) => (
      <span className="text-xs font-semibold text-success text-right block">
        {fmtCompact(r.unrealisedFX)}
      </span>
    ),
  },
  {
    key: "classification",
    header: "IFRS 9",
    render: (r) => (
      <span className="text-xs text-gray-400">{r.classification}</span>
    ),
  },
];

export function MultiCurrency() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Lifecycle
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          Multi-Currency Accounting
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          FX translation and revaluation for {ROWS.length} foreign-currency
          instruments as at 28 May 2026
        </p>
      </div>

      {/* FX rate cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { ccy: "USD/NGN", rate: FX_USD, change: "+0.6%" },
          { ccy: "GBP/NGN", rate: FX_GBP, change: "+1.1%" },
          { ccy: "EUR/NGN", rate: FX_EUR, change: "+0.3%" },
        ].map((f) => (
          <div
            key={f.ccy}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{f.ccy}</p>
            <p className="mt-2 text-xl font-bold text-dark-gray">
              ₦{f.rate.toLocaleString()}
            </p>
            <p className="text-xs text-success">{f.change} MTD</p>
          </div>
        ))}
      </div>

      {/* summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "FCY Instruments",
            value: String(ROWS.length),
            sub: "non-NGN",
          },
          {
            label: "Total FCY Exposure (₦)",
            value: fmtCompact(totalFCY),
            sub: fmtPct(totalFCY / totalPortfolio) + " of portfolio",
          },
          {
            label: "Unrealised FX Gain (₦)",
            value: fmtCompact(totalUnrealisedFX),
            sub: "period-end revaluation",
          },
          {
            label: "NGN Exposure",
            value: fmtPct(1 - totalFCY / totalPortfolio),
            sub: "domestic instruments",
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

      {/* by currency summary */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Exposure by Currency
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-400">
              <th className="pb-2 text-left font-medium">Currency</th>
              <th className="pb-2 text-right font-medium">Instruments</th>
              <th className="pb-2 text-right font-medium">BS Value (₦)</th>
              <th className="pb-2 text-right font-medium">% of FCY</th>
              <th className="pb-2 text-right font-medium">Unrealised FX (₦)</th>
            </tr>
          </thead>
          <tbody>
            {[...byCurrency.entries()].map(([ccy, data]) => (
              <tr
                key={ccy}
                className="border-b border-border/40 last:border-0 hover:bg-pale-red/20"
              >
                <td className="py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${CCY_STYLE[ccy] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {ccy}
                  </span>
                </td>
                <td className="py-3 text-right text-gray-500">{data.count}</td>
                <td className="py-3 text-right font-semibold text-dark-gray">
                  {fmtCompact(data.bsvNGN)}
                </td>
                <td className="py-3 text-right text-gray-500">
                  {fmtPct(data.bsvNGN / totalFCY)}
                </td>
                <td className="py-3 text-right font-semibold text-success">
                  {fmtCompact(data.unrealised)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DataTable columns={COLUMNS} data={ROWS} pageSize={25} />
    </div>
  );
}
